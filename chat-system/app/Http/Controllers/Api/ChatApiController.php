<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Conversation;
use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB; // <--- BẮT BUỘC PHẢI CÓ
use Illuminate\Support\Facades\Hash;

class ChatApiController extends Controller
{
    // 1. LẤY DANH SÁCH CHAT (ĐÃ SỬA GỌN GÀNG)
    // 1. API Lấy danh sách hội thoại (Có chia Tab)
    public function getConversations(Request $request)
    {
        $userId = auth()->id();
        $filter = $request->input('filter', 'mine'); // Mặc định lấy 'mine'
        $search = $request->input('search'); // Nhận từ khóa tìm kiếm

        // Eager Load 'users' relation but specifically pivot data for current user
        $query = Conversation::query()
            ->with(['socialAccount.customer', 'users', 'staff']);
            // NOTE: Removed 'messages' eager load to rely on 'last_message' column for performance

        if ($filter === 'mine') {
            // TAB 1: Chat CỦA TÔI
            $query->whereHas('users', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        } 
        elseif ($filter === 'unassigned') {
            // TAB 2: Chat CHUNG
            $query->whereHas('socialAccount')
                  ->whereDoesntHave('users');
        }

        // --- TÌM KIẾM ---
        if ($search) {
            $query->where(function($q) use ($search) {
                // 1. Tìm theo tên nhóm
                $q->where('name', 'like', "%{$search}%")
                  // 2. Tìm theo tên khách hàng hoặc tên tài khoản social
                  ->orWhereHas('socialAccount', function($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                        ->orWhereHas('customer', function($csh) use ($search) {
                            $csh->where('full_name', 'like', "%{$search}%")
                               ->orWhere('phone', 'like', "%{$search}%");
                        });
                  })
                  // 3. Tìm theo tên nhân viên nội bộ trong chat 1-1
                  ->orWhereHas('users', function($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Sắp xếp tin mới nhất lên đầu
        $conversations = $query->orderByDesc('last_message_at')->get();

        // Fetch unread counts efficiently
        // We need to calculate unread for each conversation relative to the user's last_read_at
        // Using a loop with query is slow.
        // OPTIMIZATION:
        // Use a subquery or `loadCount` with constraints if possible.
        // Given complexity of `last_read_at` being on Pivot, let's preload the necessary data.
        
        // Solution: Get all last_read_at for this user map
        $userPivotMap = DB::table('conversation_user')
            ->where('user_id', $userId)
            ->whereIn('conversation_id', $conversations->pluck('id'))
            ->pluck('last_read_at', 'conversation_id');

        // To avoid N+1 count(), we can:
        // 1. Just fetch them (slow)
        // 2. Use a single group by query to get counts for all these convos > user's read time (hard with varying times)
        // 3. MOST PERFORMANT FIX for now: Limit the number of conversations returned (Pagination) OR strict optimization.
        // Let's use simplified logic: If last_read_at < last_message_at => Unread.
        // Calculating EXACT count is expensive. Let's try to load counts efficiently.
        
        // Let's iterate but be smarter. If last_read_at >= last_message_at, count is 0.
        // Only query count() if we suspect there are unread messages.
        
        return $conversations->map(function ($conv) use ($userId, $userPivotMap) {
            $lastReadAt = $userPivotMap[$conv->id] ?? null; // Get from preloaded map

            $unreadCount = 0;
            
            // OPTIMIZATION: Only count if potentially unread
            if ($lastReadAt && $conv->last_message_at && Carbon::parse($lastReadAt)->lt($conv->last_message_at)) {
                 $unreadCount = $conv->messages()
                    ->where('created_at', '>', $lastReadAt)
                    ->count();
            } elseif (!$lastReadAt) {
                 // Never read -> unread all (or just set a flag 1 to save perf)
                 $unreadCount = 1; // Simplify to 1 to show bold, or count().
                 // If perf is critical, avoid count() here or use `conversations.unread_count` column if maintained.
                 // Falling back to count() for correctness for now but guarded by logic.
                 $unreadCount = $conv->messages()->count(); 
            }

            $isCustomer = $conv->socialAccount !== null;
            
            // --- LOGIC TÊN & AVATAR (GIỮ NGUYÊN) ---
            $displayName = 'Unknown';
            $displayAvatar = null;
            $isOnline = false;
            $targetId = 0;

            if ($isCustomer) {
                // Khách hàng
                $displayName = $conv->socialAccount->customer->full_name ?? $conv->socialAccount->name;
                $displayAvatar = $conv->socialAccount->avatar;
                $targetId = $conv->socialAccount->customer_id;
            } elseif ($conv->type === 'group') {
                // Chat Nhóm
                $displayName = $conv->name ?? 'Nhóm Chat';
                $displayAvatar = $conv->avatar; 
                if (!$displayAvatar) {
                    $displayAvatar = 'https://ui-avatars.com/api/?name=' . urlencode($displayName) . '&background=random';
                }
                $targetId = null;
            } else {
                // Chat 1-1 Nội bộ
                $otherUser = $conv->users->first(function ($u) use ($userId) {
                    return $u->id !== $userId;
                });
                if ($otherUser) {
                    $displayName = $otherUser->name;
                    $displayAvatar = $otherUser->avatar_url;
                    $isOnline = $otherUser->last_seen_at && $otherUser->last_seen_at->gt(now()->subMinutes(5));
                    $targetId = $otherUser->id;
                } else {
                    $displayName = 'Cuộc trò chuyện';
                    $displayAvatar = 'https://ui-avatars.com/api/?name=Chat';
                }
            }

            if (!$displayAvatar) {
                 $displayAvatar = 'https://ui-avatars.com/api/?name=' . urlencode($displayName) . '&background=random';
            }

            $type = $isCustomer ? $conv->socialAccount->platform : ($conv->type === 'group' ? 'group' : 'internal');

            return [
                'conversation_id' => $conv->id,
                'name' => $displayName,
                'avatar' => $displayAvatar,
                'type' => $type,
                'is_customer' => $isCustomer,
                'last_message' => $conv->last_message, // Tin nhắn cuối (Text)
                'status' => $conv->status,
                'time' => $conv->last_message_at,
                'sort_time' => $conv->last_message_at ? $conv->last_message_at->timestamp : 0,
                'unread_count' => $unreadCount, 
                'is_online' => $isOnline, 
                'target_id' => $targetId,
                'social_account' => $conv->socialAccount, 
                'staff_members' => $conv->staff, 
            ];
        });
    }

    // 2. API "Tiếp nhận khách" (Nhân viên bấm nút "Nhận" để chat)
    public function joinConversation(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $user = auth()->user();

        // Kiểm tra xem đã tham gia chưa
        if (!$conversation->users()->where('user_id', $user->id)->exists()) {
            
            // Thêm nhân viên vào hội thoại
            $conversation->users()->attach($user->id, [
                'is_assigned' => true,
                'joined_at' => now(),
                'last_read_at' => now()
            ]);

            // (Tùy chọn) Gửi tin nhắn hệ thống báo khách biết
            /*
            $conversation->messages()->create([
                'type' => 'system',
                'body' => "Nhân viên {$user->name} đã tham gia hỗ trợ bạn."
            ]);
            */
        }

        return response()->json(['message' => 'Đã tiếp nhận hội thoại thành công!']);
    }

    // Hàm này sẽ reset số tin nhắn chưa đọc về 0
    public function markAsRead($id)
    {
        // Tìm hội thoại theo ID
        $conversation = \App\Models\Conversation::find($id);

        if ($conversation) {
            // 1. Cập nhật bảng conversations (Reset unread_count về 0)
            $conversation->unread_count = 0; 
            $conversation->save(); // LƯU VÀO DB (Quan trọng nhất bước này)

            // 2. Cập nhật bảng pivot (Quan trọng: để API getConversations tính toán đúng số đỏ của từng user)
            $userId = auth()->id();
            $conversation->users()->updateExistingPivot($userId, [
                'last_read_at' => now()
            ]);

            return response()->json(['message' => 'Đã đánh dấu đã đọc']);
        }

        return response()->json(['message' => 'Không tìm thấy hội thoại'], 404);
    }

    // 2. TẠO NHÓM
    public function createGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'members' => 'required|array|min:1',
        ]);

        try {
            DB::beginTransaction();
            $user = Auth::user();
            $group = Conversation::create([
                'type' => 'group',
                'name' => $request->name,
                'owner_id' => $user->id,
                'uuid' => (string) Str::uuid(),
                'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($request->name) . '&background=random&color=fff',
                'last_message_at' => now(),
            ]);
            $group->users()->attach($user->id, ['role' => 'admin']);
            $group->users()->attach($request->members, ['role' => 'member']);
            $group->messages()->create([
                'user_id' => $user->id, 'body' => 'đã tạo nhóm "' . $request->name . '"', 'type' => 'system',
            ]);
            DB::commit();
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 3. TÌM KIẾM USER
    public function searchUsers(Request $request) {
        $query = $request->get('q');
        $users = User::where('id', '!=', Auth::id())->where('name', 'like', "%{$query}%")->limit(20)->get(['id', 'name', 'avatar_url', 'email']);
        return response()->json($users);
    }
    
    // 4. CHECK OR CREATE PRIVATE CHAT
    public function checkOrCreateConversation(Request $request) {
        $otherId = $request->target_id;
        $myId = Auth::id();
        $conv = Conversation::where(function($q) { $q->where('type', 'direct')->orWhere('type', 'private'); })
            ->whereHas('users', fn($q) => $q->where('user_id', $myId))
            ->whereHas('users', fn($q) => $q->where('user_id', $otherId))->first();
        if (!$conv) {
            $conv = Conversation::create(['type' => 'direct', 'uuid' => (string) Str::uuid(), 'last_message_at' => now()]);
            $conv->users()->attach([$myId, $otherId]);
        }
        return response()->json(['id' => $conv->id]);
    }

    // 5. GET MESSAGES
    public function getMessages(Request $request, $id) {
        $conversation = Conversation::findOrFail($id);
        
        // Allow viewing if user is a participant OR if the conversation is unassigned (no users yet)
        $isParticipant = $conversation->users->contains('id', Auth::id());
        $isUnassigned = $conversation->users()->count() === 0;

        if (!$isParticipant && !$isUnassigned) {
             return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        // Eager load 'user' và 'conversation.socialAccount' để Helper Message::getSenderInfoAttribute chạy tối ưu
        $messages = $conversation->messages()
            ->with(['user', 'conversation.socialAccount'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages->map(function ($msg) {
            // Sử dụng Helper từ Model Message để lấy chuẩn thông tin người gửi
            $senderInfo = $msg->sender_info;

            return [
                'id' => $msg->id,
                'user_id' => $msg->user_id,
                'body' => $msg->body,
                'is_me' => $msg->user_id === Auth::id(),
                'created_at' => $msg->created_at->format('H:i'),
                'sender' => $senderInfo, // <-- Dùng helper mới
                'attachment_path' => $msg->attachment_path,
                'attachment_type' => $msg->attachment_type,
                'attachment_name' => $msg->attachment_name,
            ];
        }));
    }

    // 6. SEND MESSAGE
    public function sendMessage(Request $request, $id = null) {
        $conversationId = $id ?? $request->input('conversation_id');
        $conversation = Conversation::findOrFail($conversationId);

        // Validate Data as requested
        $request->validate([
            'body' => 'required_without:attachment|string|nullable',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $user = Auth::user();

        // LOGIC MỚI: AUTO-JOIN
        // Nếu nhân viên này chưa có trong danh sách tham gia -> Tự động thêm vào
        if ($user && !$conversation->users()->where('user_id', $user->id)->exists()) {
            $conversation->users()->attach($user->id, [
                'is_assigned' => true, // Đánh dấu là người phụ trách chính
                'joined_at' => now(),
                'last_read_at' => now()
            ]);
        }

        // XỬ LÝ NGƯỜI GỬI:
        // - Nếu là Nhân viên (có Auth): user_id = Auth::id()
        // - Nếu là Webhook (không Auth): user_id = null
        $userId = Auth::id(); 

        $data = ['user_id' => $userId, 'body' => $request->body ?? '', 'type' => 'text'];
        
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('chat_uploads', 'public');
            $data['attachment_path'] = '/storage/' . $path;
            $data['attachment_type'] = str_starts_with($request->file('attachment')->getMimeType(), 'image/') ? 'image' : 'file';
            $data['attachment_name'] = $request->file('attachment')->getClientOriginalName();
        }

        $msg = $conversation->messages()->create($data);
        
        $user = Auth::user();
        $senderName = $user ? $user->name : 'Guest';
        // Tính toán nội dung preview cho last_message
        $preview = $data['body'];
        if (empty($preview) && isset($data['attachment_type'])) {
             $preview = $data['attachment_type'] === 'image' ? '[Hình ảnh]' : '[File đính kèm]';
        } elseif ($data['type'] !== 'text') {
             $preview = '[' . $data['type'] . ']';
        }
        
        $conversation->update([
            'last_message' => $preview, 
            'last_message_at' => now(), 
            'unread_count' => 0         
        ]);
        
        // --- FB REPLY LOGIC START ---
        if ($conversation->type === 'facebook' && $conversation->socialAccount) {
            try {
                $pageAccessToken = config('services.facebook.page_access_token');
                $recipientId = $conversation->socialAccount->social_id;
                
                $fbPayload = [
                    'recipient' => ['id' => $recipientId],
                    'message' => ['text' => $data['body']]
                ];
                
                // Nhanh gọn: Nếu có ảnh thì gửi thông báo (vì upload ảnh cần API khác phức tạp hơn)
                if (isset($data['attachment_path'])) {
                     $fbPayload['message']['text'] .= " [Sent attachment: {$data['attachment_name']}]";
                }

                Http::post("https://graph.facebook.com/v11.0/me/messages?access_token={$pageAccessToken}", $fbPayload);

            } catch (\Exception $e) {
                Log::error("FB Reply Check failed: " . $e->getMessage());
            }
        }
        // --- FB REPLY LOGIC END ---

        try { broadcast(new \App\Events\MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
        
        // Trả về kèm sender_info để frontend hiển thị ngay
        $msg->load(['user', 'conversation.socialAccount']);
        $msg->sender = $msg->sender_info;
        
        return response()->json(['status' => 'ok', 'message' => $msg]);
    }
    public function getInternalUsers()
    {
        $users = User::where('id', '!=', Auth::id())->get()->map(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar_url,
                'is_online' => $user->is_online, // Cần logic check cache online
                'custom_status' => $user->custom_status, // "Đang fix bug"
                'activity_type' => $user->activity_type,
                'last_active' => $user->last_active_at, // Thời gian online cuối
            ];
        });
        
        return response()->json($users);
    }
    // 7. GET GROUP MEMBERS
    public function getGroupMembers($id) {
        $conversation = Conversation::findOrFail($id);
        
        // Use the pivot table to get role
        // Also check online status if you have a mechanism (e.g. cache or last_activity)
        // Here we reuse logic similar to getConversations or just return details
        
        $members = $conversation->users->map(function($user) use ($conversation) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar_url ?? 'https://ui-avatars.com/api/?name=' . urlencode($user->name),
                'role' => $user->pivot->role, // 'admin' or 'member'
                'is_online' => $user->is_online, // Assuming is_online param exists on User model or we calculate it
                'is_owner' => $user->id === $conversation->owner_id,
            ];
        });
        
        return response()->json($members);
    }

    // 8. RENAME GROUP
    public function updateGroupName(Request $request, $id) {
        $request->validate(['name' => 'required|string|max:50']);
        $conversation = Conversation::findOrFail($id);
        
        // Allow owner or admin to rename? Usually anyone in small chats, but let's restrict to owner for now based on prompt "Admin Actions... allow them to Remove" 
        // Prompt says "Header: Display Group Avatar and Group Name (with an Edit button to rename)." It doesn't explicitly restrict rename to admin.
        // Let's allow any member to rename for flexibility unless strict.
        if (!$conversation->users->contains(Auth::id())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $conversation->update(['name' => $request->name]);
        // System message
        $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => 'đã đổi tên nhóm thành "' . $request->name . '"',
            'type' => 'system',
        ]);

        return response()->json(['status' => 'success', 'name' => $request->name]);
    }

    // 9. ADD MEMBERS
    public function addMembers(Request $request, $id) {
        $request->validate(['members' => 'required|array']); // Array of user IDs
        $conversation = Conversation::findOrFail($id);
        
        if (!$conversation->users->contains(Auth::id())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $newMembers = $request->members;
        // Filter out existing
        $existing = $conversation->users()->pluck('users.id')->toArray();
        $toAdd = array_diff($newMembers, $existing);
        
        if (!empty($toAdd)) {
            $conversation->users()->attach($toAdd, ['role' => 'member']);
            
            // System message
            $names = User::whereIn('id', $toAdd)->pluck('name')->implode(', ');
            $conversation->messages()->create([
                'user_id' => Auth::id(),
                'body' => 'đã thêm ' . $names . ' vào nhóm',
                'type' => 'system',
            ]);
        }
        
        return response()->json(['status' => 'success']);
    }

    // 10. REMOVE MEMBER
    public function removeMember($id, $userId) {
        $conversation = Conversation::findOrFail($id);
        
        // Only owner can remove
        if ($conversation->owner_id !== Auth::id()) {
             return response()->json(['error' => 'Only owner can remove members'], 403);
        }
        
        if ($conversation->owner_id == $userId) {
             return response()->json(['error' => 'Cannot remove owner'], 400);
        }

        $conversation->users()->detach($userId);
        
        $kickedUser = User::find($userId);
        $name = $kickedUser ? $kickedUser->name : 'Thành viên';

        $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => 'đã mời ' . $name . ' ra khỏi nhóm',
            'type' => 'system',
        ]);
        
        return response()->json(['status' => 'success']);
    }

    // 11. LEAVE GROUP
    public function leaveGroup($id) {
        $conversation = Conversation::findOrFail($id);
        $userId = Auth::id();

        if ($conversation->owner_id === $userId) {
             return response()->json(['error' => 'Bạn là trưởng nhóm, không thể rời nhóm lúc này.'], 400);
        }

        $conversation->users()->detach($userId);
        
        $conversation->messages()->create([
            'user_id' => $userId,
            'body' => 'đã rời nhóm',
            'type' => 'system',
        ]);
        
        return response()->json(['status' => 'success']);
    }

    // 12. UPDATE PROFILE
    public function updateProfile(Request $request) {
        $user = Auth::user();
        $request->validate([
            'name' => 'required|string|max:255',
            'avatar' => 'nullable|image|max:2048', // 2MB
            'password' => 'nullable|confirmed|min:6',
        ]);

        $user->name = $request->name;

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = '/storage/' . $path;
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json(['status' => 'success', 'user' => $user]);
    }

    // 13. ADD STAFF TO CONVERSATION
    // 13. ADD CONVERSATION MEMBER (Staff/User)
    public function addMember(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);
        $newUserId = $request->input('user_id'); // ID của nhân viên muốn thêm
        
        // 1. Kiểm tra xem nhân viên đó đã có trong nhóm chưa
        if (!$conversation->staff()->where('user_id', $newUserId)->exists()) {
            
            // 2. Thêm vào bảng trung gian
            $conversation->staff()->attach($newUserId, [
                'is_assigned' => false, // Người này chỉ là hỗ trợ phụ
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 3. (Tùy chọn) Gửi tin nhắn hệ thống báo cho mọi người biết
            $conversation->messages()->create([
                'user_id' => null, // Hệ thống gửi (hoặc dùng ID admin)
                'type' => 'system', // Cần thêm loại này vào DB nếu chưa có
                'body' => auth()->user()->name . ' đã thêm nhân viên mới vào cuộc trò chuyện.',
            ]);
            
            // 4. Bắn WebSocket để nhân viên kia nhận được thông báo ngay lập tức
            // broadcast(new ConversationUpdated($conversation));
        }

        return response()->json(['message' => 'Đã thêm nhân viên thành công']);
    }

    // 14. SIMULATE CUSTOMER REPLY (DEV ONLY)
    public function simulateCustomerReply(Request $request)
    {
        $conversationId = $request->input('conversation_id');
        // Default text if missing
        $text = $request->input('message', 'Chào shop, mình mới nhận được hàng rồi nhé!');

        // 1. Create message with user_id = null (Customer)
        $message = Message::create([
            'conversation_id' => $conversationId,
            'user_id' => null, 
            'body' => $text,
            'type' => 'text',
        ]);

        // 2. Update conversation
        $conversation = Conversation::findOrFail($conversationId);
        
        // Format last_message
        $senderName = $conversation->socialAccount ? $conversation->socialAccount->name : 'Khách hàng';
        
        $conversation->update([
            'last_message' => $senderName . ': ' . $text,
            'last_message_at' => now(),
        ]);

        // 3. Broadcast WebSocket
        broadcast(new \App\Events\MessageSent($message));

        return response()->json(['message' => 'Đã giả lập khách nhắn tin thành công!', 'data' => $message]);
    }

    public function getCustomerHistory(Request $request, $customerId)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = auth()->user();
        
        if (!$user->hasRole('admin_dev|manager')) {
            $hasAccess = \Illuminate\Support\Facades\DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $customerId)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền xem thông tin khách hàng này'], 403);
            }
        }

        $limit = $request->input('limit', 5); // Mặc định lấy 5 cái
        $offset = $request->input('offset', 0); // Bắt đầu từ 0

        // Tìm các conversation cũ của khách này
        // Logic: Truy vấn qua SocialAccount -> Customer
        $conversations = Conversation::whereHas('socialAccount', function($q) use ($customerId) {
            $q->where('customer_id', $customerId);
        })
        ->with(['messages' => function($q) {
            $q->latest()->limit(1); // Chỉ lấy tin cuối để hiển thị preview
        }])
        ->orderByDesc('created_at')
        ->skip($offset)
        ->take($limit)
        ->get();

        return response()->json($conversations);
    }
}