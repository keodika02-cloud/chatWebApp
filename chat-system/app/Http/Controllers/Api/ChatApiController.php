<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB; // <--- BẮT BUỘC PHẢI CÓ

class ChatApiController extends Controller
{
    // 1. LẤY DANH SÁCH CHAT (ĐÃ SỬA GỌN GÀNG)
    public function getConversations(Request $request)
    {
        try {
            // Chỉ lấy những cuộc hội thoại mà mình đang tham gia
            // Không lấy User rác nữa
            $conversations = Auth::user()->conversations()
                ->with(['lastMessage.user', 'users']) 
                ->get()
                ->map(function ($conv) {
                    $myId = Auth::id();

                    // LOGIC CHO CHAT 1-1
                    if ($conv->type === 'direct' || $conv->type === 'private') {
                        // Tìm người kia
                        $partner = $conv->users->firstWhere('id', '!=', $myId);
                        
                        // Nếu không tìm thấy đối phương (ví dụ chat với chính mình hoặc lỗi data)
                        if (!$partner) $partner = Auth::user();

                        return [
                            'conversation_id' => $conv->id,
                            'target_id' => $partner->id,
                            'name' => $partner->name, // Lấy tên người kia
                            'avatar' => $partner->avatar_url ?? 'https://ui-avatars.com/api/?name='.urlencode($partner->name),
                            'is_online' => false, // Có thể update logic online sau
                            'role' => 'Staff',
                            'last_message' => $conv->lastMessage ? Str::limit($conv->lastMessage->body, 30) : 'Bắt đầu trò chuyện',
                            'last_time' => $conv->lastMessage ? $conv->lastMessage->created_at->diffForHumans() : '',
                            
                            // QUAN TRỌNG: Dùng timestamp của tin nhắn cuối để sắp xếp
                            'sort_time' => $conv->lastMessage 
                                ? $conv->lastMessage->created_at->timestamp 
                                : $conv->created_at->timestamp,
                            
                            'type' => 'private',
                            'is_unread' => false // Logic chưa đọc tính sau
                        ];
                    } 
                    
                    // LOGIC CHO CHAT NHÓM
                    else {
                        $senderName = 'Hệ thống';
                        if ($conv->lastMessage && $conv->lastMessage->user) {
                            $senderName = ($conv->lastMessage->user_id === $myId) 
                                ? 'Bạn' 
                                : $conv->lastMessage->user->name;
                        }

                        return [
                            'conversation_id' => $conv->id,
                            'target_id' => null,
                            'name' => $conv->name,
                            'avatar' => $conv->avatar ?? 'https://ui-avatars.com/api/?name='.urlencode($conv->name),
                            'is_online' => true,
                            'role' => 'Group',
                            'last_message' => $conv->lastMessage 
                                ? ($senderName . ': ' . Str::limit($conv->lastMessage->body, 20)) 
                                : 'Nhóm mới tạo',
                            'last_time' => $conv->lastMessage ? $conv->lastMessage->created_at->diffForHumans() : '',
                            
                            'sort_time' => $conv->lastMessage 
                                ? $conv->lastMessage->created_at->timestamp 
                                : $conv->created_at->timestamp,
                                
                            'type' => 'group'
                        ];
                    }
                })
                // Sắp xếp ngay tại server: Mới nhất lên đầu
                ->sortByDesc('sort_time')
                ->values();

            return response()->json($conversations);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Server Error: ' . $e->getMessage()], 500);
        }
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
    public function getMessages($id) {
        $conversation = Conversation::findOrFail($id);
        if (!$conversation->users->contains(Auth::id())) return response()->json(['error' => 'Unauthorized'], 403);
        return response()->json($conversation->messages()->with('user')->latest()->limit(50)->get()->map(function ($msg) {
            return [
                'id' => $msg->id,
                'body' => $msg->body,
                'is_me' => $msg->user_id === Auth::id(),
                'created_at' => $msg->created_at->format('H:i'),
                'sender' => ['name' => $msg->user->name ?? 'System', 'avatar' => $msg->user->avatar_url ?? null],
                'attachment_path' => $msg->attachment_path,
                'attachment_type' => $msg->attachment_type,
                'attachment_name' => $msg->attachment_name,
            ];
        })->reverse()->values());
    }

    // 6. SEND MESSAGE
    public function sendMessage(Request $request, $id) {
        $conversation = Conversation::findOrFail($id);
        $data = ['user_id' => Auth::id(), 'body' => $request->body ?? '', 'type' => 'text'];
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('chat_uploads', 'public');
            $data['attachment_path'] = '/storage/' . $path;
            $data['attachment_type'] = str_starts_with($request->file('attachment')->getMimeType(), 'image/') ? 'image' : 'file';
            $data['attachment_name'] = $request->file('attachment')->getClientOriginalName();
        }
        $msg = $conversation->messages()->create($data);
        $conversation->update(['last_message_at' => now()]);
        try { broadcast(new \App\Events\MessageSent($msg))->toOthers(); } catch (\Exception $e) {}
        return response()->json(['status' => 'ok', 'message' => $msg]);
    }
}