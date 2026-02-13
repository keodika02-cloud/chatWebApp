<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\SocialAccount;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Str;

class UnassignedChatSeeder extends Seeder
{
    public function run()
    {
        // 1. Tạo khách hàng vãng lai
        $customer = Customer::firstOrCreate(
            ['email' => 'visitor@example.com'],
            ['full_name' => 'Khách Vãng Lai', 'phone' => '0912345678', 'source' => 'zalo']
        );

        // 2. Tạo tài khoản Zalo giả
        $social = SocialAccount::create([
            'customer_id' => $customer->id,
            'platform' => 'zalo',
            'social_id' => 'zalo_user_'.rand(100,999),
            'name' => 'Người Lạ (Zalo)',
            'avatar' => 'https://ui-avatars.com/api/?name=Zalo+User&background=0088FF&color=fff',
        ]);

        // 3. Tạo hội thoại (KHÔNG GÁN CHO AI CẢ - Để nó vào tab "Chưa phân công")
        $conv = Conversation::create([
            'social_account_id' => $social->id,
            'uuid' => Str::uuid(),
            'type' => 'zalo',
            'status' => 'open',
            'last_message' => 'Shop ơi tư vấn mình với!',
            'last_message_at' => now(),
        ]);

        // 4. Tạo tin nhắn của khách
        Message::create([
            'conversation_id' => $conv->id,
            'user_id' => null, // Khách nhắn
            'body' => 'Shop ơi tư vấn mình với!',
            'type' => 'text',
        ]);

        $this->command->info('Đã tạo 1 hội thoại CHƯA PHÂN CÔNG (Unassigned).');
    }
}
