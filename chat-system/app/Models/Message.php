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
        'uuid',
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
}