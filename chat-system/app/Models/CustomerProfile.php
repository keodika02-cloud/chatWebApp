<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id', 
        'phone', 
        'email', 
        'address', 
        'source', 
        'pipeline_stage', 
        'tags', 
        'notes'
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}
