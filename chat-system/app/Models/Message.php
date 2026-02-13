<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id', 
        'user_id', 
        'body', 
        'type', 
        'attachment_path', 
        'attachment_type', 
        'attachment_name'
    ];
    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // Tin nhắn thuộc về 1 user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Tin nhắn thuộc về 1 hội thoại
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
    // 2. Helper để xác định người gửi là ai (Dùng cho Frontend dễ xử lý)
    // Trả về: 'staff' hoặc 'customer'
    public function getSenderTypeAttribute()
    {
        return $this->user_id ? 'staff' : 'customer';
    }

    // 3. Lấy thông tin người gửi (Tên + Avatar) bất kể là ai
    public function getSenderInfoAttribute()
    {
        if ($this->user_id) {
            // Là nhân viên
            return [
                'name' => $this->user->name ?? 'Nhân viên',
                'avatar' => $this->user->avatar_url ?? '/default-avatar.png',
                'type' => 'staff'
            ];
        } else {
            // Là khách hàng -> Lấy từ Conversation -> SocialAccount -> Name
            // (Giả sử bạn đã load relation conversation.socialAccount)
            $socialAccount = $this->conversation ? $this->conversation->socialAccount : null;
            
            return [
                'name' => $socialAccount->name ?? 'Khách hàng',
                'avatar' => $socialAccount->avatar ?? '/default-customer.png',
                'type' => 'customer'
            ];
        }
    }
}