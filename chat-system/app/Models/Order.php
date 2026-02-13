<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'customer_id',
        'conversation_id',
        'total_amount',
        'status',
        'shipping_fee',
        'discount',
        'payment_method',
        'internal_note',
        'shipping_address',
    ];

    /**
     * Relationship: An Order has many Items
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
