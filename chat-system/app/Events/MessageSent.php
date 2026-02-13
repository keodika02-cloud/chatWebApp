<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Dùng Now để chat nhanh hơn
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        // Thông báo cho tất cả thành viên trong cuộc hội thoại để cập nhật Sidebar
        // Thông báo cho tất cả thành viên trong cuộc hội thoại để cập nhật Sidebar
        $userIds = $this->message->conversation->users->pluck('id');
        
        if ($userIds->isEmpty()) {
            // Nếu chưa có ai nhận (unassigned), bắn vào kênh chung
            $channels[] = new PrivateChannel('conversations.unassigned');
        } else {
            foreach ($userIds as $userId) {
                $channels[] = new PrivateChannel('App.Models.User.' . $userId);
            }
        }

        return $channels;
    }

    /**
     * Dữ liệu sẽ gửi xuống Client (JSON)
     */
    public function broadcastWith(): array
    {
        $senderName = 'System';
        $senderAvatar = null;

        if ($this->message->user) {
            $senderName = $this->message->user->name;
            $senderAvatar = $this->message->user->avatar_url;
        } elseif ($this->message->conversation && $this->message->conversation->socialAccount) {
            $senderName = $this->message->conversation->socialAccount->name; // Khách hàng
            $senderAvatar = $this->message->conversation->socialAccount->avatar;
        }

        return [
            'id' => $this->message->id,
            'body' => $this->message->body,
            'is_me' => false, 
            'created_at' => $this->message->created_at->format('H:i'),
            'sender' => [
                'name' => $senderName,
                'avatar' => $senderAvatar,
            ],
            'user_id' => $this->message->user_id, 
            'conversation_id' => $this->message->conversation_id,
            'attachment_path' => $this->message->attachment_path,
            'attachment_type' => $this->message->attachment_type,
            'attachment_name' => $this->message->attachment_name,
        ];
    }
}
