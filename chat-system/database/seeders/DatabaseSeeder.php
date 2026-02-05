<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Gọi đến file ChatSeeder mà chúng ta đã viết
        $this->call(ChatSeeder::class);
    }
}