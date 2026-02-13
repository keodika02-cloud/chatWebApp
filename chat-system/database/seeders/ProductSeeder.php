<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run()
    {
        Product::create([
            'name' => 'Laptop Dell XPS 13',
            'sku' => 'DELL-XPS-13',
            'price' => 25000000,
            'stock' => 10,
            'image_url' => 'https://via.placeholder.com/150'
        ]);
        
        Product::create([
            'name' => 'Chuột Logitech MX Master 3',
            'sku' => 'LOGI-MX3',
            'price' => 2500000,
            'stock' => 50,
            'image_url' => 'https://via.placeholder.com/150'
        ]);

        // Tạo thêm 10 sp ngẫu nhiên
        Product::factory(10)->create(); 
    }
}