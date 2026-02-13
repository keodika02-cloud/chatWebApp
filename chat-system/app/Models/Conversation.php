<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Conversation extends Model
{
    use HasFactory;

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // QUAN TRỌNG: Phải khai báo đủ các cột này thì mới tạo được nhóm
    protected $fillable = [
        'uuid', 
        'name', 
        'type', 
        'avatar', 
        'owner_id', 
        'department_id', 
        'last_message_at',
        'status',
        'social_account_id',
        'last_message',
        'unread_count',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    

    // Quan hệ: Một nhóm có nhiều thành viên
    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_user')
                    ->withPivot('role', 'joined_at', 'last_read_at', 'is_assigned')
                    ->withTimestamps();
    }

    // Quan hệ: Một hội thoại có nhiều tin nhắn
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    // Helper: Lấy tin nhắn cuối cùng
    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latest();
    }
    public function socialAccount()
    {
        return $this->belongsTo(SocialAccount::class);
    }

    // Hàm tiện ích: Lấy thông tin khách hàng nhanh
    public function getCustomerAttribute()
    {
        return $this->socialAccount ? $this->socialAccount->customer : null;
    }

    // QUAN HỆ MỚI: Nhiều nhân viên cùng tham gia (Many-to-Many)
    public function staff() {
        return $this->belongsToMany(User::class, 'conversation_user')
                    ->withPivot('is_assigned', 'last_read_at')
                    ->withTimestamps();
    }
}