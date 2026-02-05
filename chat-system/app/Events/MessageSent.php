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
        // Kênh riêng tư cho mỗi cuộc hội thoại
        return [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];
    }

    /**
     * Dữ liệu sẽ gửi xuống Client (JSON)
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'body' => $this->message->body,
            'is_me' => false, // Khi broadcast đến người KHÁC, thì luôn là false (không phải họ tự gửi)
            'created_at' => $this->message->created_at->format('H:i'),
            'sender' => [
                'name' => $this->message->user->name ?? 'System',
                'avatar' => $this->message->user->avatar_url,
            ],
            'user_id' => $this->message->user_id, // Để client check duplicate
            'conversation_id' => $this->message->conversation_id,
            'attachment_path' => $this->message->attachment_path,
            'attachment_type' => $this->message->attachment_type,
            'attachment_name' => $this->message->attachment_name,
        ];
    }
}
