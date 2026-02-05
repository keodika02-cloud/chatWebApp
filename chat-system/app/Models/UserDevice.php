<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'platform', // android, ios, web
        'fcm_token',
        'last_active_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}