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

class ChatApiController extends Controller
{
    // 1. LẤY DANH BẠ (HIỂN THỊ TẤT CẢ NHÂN VIÊN)
    public function getConversations(Request $request)
    {
        try {
            $myId = Auth::id();

            // BƯỚC 1: Lấy danh sách nhân viên (Trừ bản thân mình)
            // Giới hạn 50 người để demo (Thực tế có thể phân trang)
            $users = User::where('id', '!=', $myId)
                        ->where('is_active', true)
                        ->limit(50) 
                        ->get();

            // BƯỚC 2: Lấy các hội thoại ĐÃ CÓ của mình để so sánh
            $existingConversations = Conversation::whereHas('users', function ($q) use ($myId) {
                $q->where('users.id', $myId);
            })->with(['users', 'messages' => function($q) {
                $q->latest()->limit(1); // Lấy tin nhắn mới nhất
            }])->get();

            // BƯỚC 3: Ghép dữ liệu (User + Hội thoại nếu có)
            $data = $users->map(function ($user) use ($existingConversations) {
                
                // Tìm xem mình và user này đã có hội thoại chưa (Type = direct)
                $conversation = $existingConversations->first(function ($conv) use ($user) {
                    // Check xem hội thoại này có chứa user kia không
                    return $conv->type->value === 'direct' && $conv->users->contains('id', $user->id);
                });

                $lastMsg = $conversation ? $conversation->messages->first() : null;
                $isOnline = $user->last_seen_at && Carbon::parse($user->last_seen_at)->diffInMinutes(now()) < 5;
                $role = method_exists($user, 'getRoleNames') ? ($user->getRoleNames()->first() ?? 'Staff') : 'Staff';

                return [
                    // QUAN TRỌNG: 
                    // - conversation_id: ID hội thoại (Nếu null nghĩa là chưa chat bao giờ)
                    // - target_id: ID của người dùng (Dùng để tạo chat mới)
                    'conversation_id' => $conversation ? $conversation->id : null,
                    'target_id' => $user->id,
                    
                    'name' => $user->name,
                    'avatar' => $user->avatar_url,
                    'is_online' => $isOnline,
                    'role' => $role,
                    
                    // Nếu chưa chat thì hiện dòng mời gọi
                    'last_message' => $lastMsg ? Str::limit($lastMsg->body, 30) : '👋 Bấm để bắt đầu chat',
                    'last_time' => $lastMsg ? $lastMsg->created_at->diffForHumans() : '',
                    
                    // Logic sắp xếp: Ai nhắn gần nhất thì lên đầu, chưa nhắn thì xuống dưới
                    'sort_time' => $lastMsg ? $lastMsg->created_at->timestamp : 0,
                    'has_history' => $conversation ? true : false
                ];
            });

            // Sắp xếp danh sách (Người mới chat lên đầu)
            $sortedData = $data->sortByDesc('sort_time')->values();

            return response()->json($sortedData);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ... (Giữ nguyên các hàm getMessages, sendMessage, checkOrCreateConversation cũ) ...
    // Nếu bạn lỡ xóa thì copy lại các hàm đó ở các bước trước nhé.
    
    // 2. LẤY TIN NHẮN
    public function getMessages($id)
    {
        $conversation = Conversation::findOrFail($id);
        if (!$conversation->users->contains(Auth::id())) return response()->json([], 403);

        $messages = $conversation->messages()->with('user')->latest()->limit(50)->get()
            ->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'body' => $msg->body,
                    'is_me' => $msg->user_id === Auth::id(),
                    'created_at' => $msg->created_at->format('H:i'),
                    'sender' => ['name' => $msg->user->name ?? 'System'],
                    // Thêm trường file
                    'attachment_path' => $msg->attachment_path,
                    'attachment_type' => $msg->attachment_type,
                    'attachment_name' => $msg->attachment_name,
                ];
            })->reverse()->values();

        return response()->json($messages);
    }

    // 3. GỬI TIN
    public function sendMessage(Request $request, $id)
    {
        // Validate thêm file
        $request->validate([
            'attachment' => 'nullable|file|max:10240', // Max 10MB
        ]);

        $conversation = Conversation::findOrFail($id);
        
        $data = [
            'user_id' => Auth::id(),
            'body' => $request->body ?? '', // Có thể gửi file mà không cần text
            'type' => 'text'
        ];

        // Xử lý Upload File
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            
            // 1. Lưu file vào folder 'public/chat_uploads'
            $path = $file->store('chat_uploads', 'public');
            
            // 2. Xác định loại file (ảnh hay tệp tin)
            $mime = $file->getMimeType();
            $type = str_starts_with($mime, 'image/') ? 'image' : 'file';

            // 3. Gán dữ liệu vào DB
            $data['attachment_path'] = '/storage/' . $path;
            $data['attachment_type'] = $type;
            $data['attachment_name'] = $file->getClientOriginalName();
            $data['type'] = $type; // Đổi loại tin nhắn
        }

        $message = $conversation->messages()->create($data);
        $conversation->update(['last_message_at' => now()]);

        // Broadcast
        broadcast(new \App\Events\MessageSent($message))->toOthers();

        return response()->json(['status' => 'ok', 'message' => $message]);
    }

    // 4. TẠO HỘI THOẠI
    public function checkOrCreateConversation(Request $request)
    {
        $otherId = $request->target_id;
        $myId = Auth::id();
        $conv = Conversation::where('type', 'direct')
            ->whereHas('users', fn($q) => $q->where('user_id', $myId))
            ->whereHas('users', fn($q) => $q->where('user_id', $otherId))->first();

        if (!$conv) {
            $conv = Conversation::create(['type' => 'direct', 'last_message_at' => now()]);
            $conv->users()->attach([$myId, $otherId]);
        }
        $u = User::find($otherId);
        return response()->json(['id' => $conv->id, 'name' => $u->name, 'avatar' => $u->avatar_url]);
    }
}