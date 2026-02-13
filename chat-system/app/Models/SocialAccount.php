<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SocialAccount extends Model
{
    protected $fillable = [
        'customer_id',
        'social_id',
        'platform',
        'name',
        'avatar',
    ];

    // Thuộc về 1 khách hàng gốc
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Một nick FB có thể có nhiều cuộc hội thoại (thường là 1, nhưng cứ để hasMany cho chắc)
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}