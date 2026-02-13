<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'sku', // Mã sản phẩm
        'price', 
        'cost_price', // Giá vốn (nếu cần)
        'stock', // Tồn kho
        'image_url',
        'description'
    ];
}
