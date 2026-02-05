<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\ConversationType;
use Illuminate\Support\Str;

class Conversation extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    protected $casts = [
        'last_message_at' => 'datetime',
        'type' => ConversationType::class,
    ];

    // Quan hệ: Một hội thoại có nhiều tin nhắn
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    // Quan hệ: Hội thoại có nhiều thành viên (Many-to-Many)
    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_user');
    }

}