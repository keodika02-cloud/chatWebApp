<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\SocialAccount;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Str; // <--- 1. NHỚ THÊM DÒNG NÀY

class OmnichannelSeeder extends Seeder
{
    public function run()
    {
        // ... (Đoạn tạo Customer và SocialAccount giữ nguyên)
        $customer = Customer::firstOrCreate(
            ['phone' => '0988123456'],
            ['full_name' => 'Nguyễn Thị Khách Hàng', 'pipeline_stage' => 'potential']
        );

        $social = SocialAccount::firstOrCreate(
            ['platform' => 'facebook', 'social_id' => 'fb_123456789'],
            [
                'customer_id' => $customer->id,
                'name' => 'Bé Heo (Khách FB)',
                'avatar' => 'https://ui-avatars.com/api/?name=Be+Heo&background=1877F2&color=fff'
            ]
        );

        // ...

        // 3. SỬA ĐOẠN NÀY
        $conv = Conversation::firstOrCreate(
            ['social_account_id' => $social->id],
            [
                'uuid' => Str::uuid(), // <--- 2. THÊM DÒNG NÀY
                'status' => 'open',
                'last_message' => 'Shop ơi tư vấn em cái này với',
                'last_message_at' => now(),
            ]
        );

        // ... (Các đoạn dưới giữ nguyên)
        if (!$conv->staff()->where('user_id', 1)->exists()) {
             $conv->staff()->attach(1, ['is_assigned' => true]);
        }

        if ($conv->messages()->count() == 0) {
            Message::create([
                'conversation_id' => $conv->id,
                'user_id' => null,
                'body' => 'Shop ơi tư vấn em cái này với',
                'type' => 'text'
            ]);
        }
    }
}