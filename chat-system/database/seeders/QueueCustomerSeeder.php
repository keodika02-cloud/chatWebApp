<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Customer;
use App\Models\SocialAccount;
use Illuminate\Support\Str;

class QueueCustomerSeeder extends Seeder
{
    public function run()
    {
        // 1. Tạo Khách hàng vãng lai
        $customer = Customer::firstOrCreate(
            ['phone' => '0888888888'],
            [
                'full_name' => 'Khách Hàng Đang Chờ',
                'email' => 'waiting@example.com',
                'tags' => ['Mới', 'Chờ xử lý'],
                'source' => 'facebook'
            ]
        );

        // 2. Tạo Social Account
        $socialAccount = SocialAccount::create([
            'customer_id' => $customer->id,
            'social_id' => 'fb_waiting_' . rand(1000, 9999),
            'platform' => 'facebook',
            'name' => 'Khách Facebook (Chờ)',
            'avatar' => 'https://ui-avatars.com/api/?name=Khach+Cho&background=random',
        ]);

        // 3. Tạo Hội thoại (KHÔNG GÁN USER NÀO -> NẰM TRONG QUEUE)
        $conversation = Conversation::create([
            'social_account_id' => $socialAccount->id,
            'type' => 'facebook',
            'status' => 'open', // Trạng thái mở
            'uuid' => Str::uuid(),
            'last_message' => 'Tư vấn cho mình sản phẩm này với!',
            'last_message_at' => now(),
        ]);

        // 4. Tạo tin nhắn đầu tiên của khách
        Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => null, // Khách nhắn
            'body' => 'Tư vấn cho mình sản phẩm này với!',
            'type' => 'text',
        ]);

        $this->command->info("✅ Đã tạo khách hàng trong hàng chờ (Queue) thành công!");
    }
}
