<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});


Broadcast::channel('conversation.{id}', function ($user, $id) {
    if (!$user) return false;
    $conversation = \App\Models\Conversation::find($id);
    if (!$conversation) return false;
    
    // User is participant OR conversation is strictly unassigned (no staff yet)
    // Assuming staff management logic allows any staff to view unassigned
    return $conversation->users->contains('id', $user->id) || $conversation->users()->count() === 0;
});

// Kênh chung cho các cuộc hội thoại chưa được gán (để update sidebar cho tất cả staff)
Broadcast::channel('conversations.unassigned', function ($user) {
    return auth()->check(); // Chỉ cần đăng nhập là nghe được
});

// 2. KÊNH ONLINE (THÊM CÁI NÀY)
// Trả về thông tin user nếu họ đã đăng nhập
Broadcast::channel('online', function ($user) {
    if (auth()->check()) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
