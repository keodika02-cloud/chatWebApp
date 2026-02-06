<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    // QUAN TRỌNG: Phải khai báo đủ các cột này thì mới tạo được nhóm
    protected $fillable = [
        'uuid', 
        'name', 
        'type', 
        'avatar', 
        'owner_id', 
        'department_id', 
        'last_message_at',
        'status'
    ];

    // Quan hệ: Một nhóm có nhiều thành viên
    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_user')
                    ->withPivot('role', 'joined_at')
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
}