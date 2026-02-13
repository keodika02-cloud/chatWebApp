<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model {
    protected $fillable = [
        'full_name',
        'phone',
        'email', 
        'pipeline_stage',
        'tags'
    ];
    protected $casts = ['tags' => 'array'];

    public function socialAccounts() {
        return $this->hasMany(SocialAccount::class);
    }
    
    // Lấy tất cả hội thoại của khách này (thông qua các nick MXH)
    public function conversations() {
        return $this->hasManyThrough(Conversation::class, SocialAccount::class);
    }
    // Lấy đơn hàng (nếu bạn đã có bảng orders)
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}