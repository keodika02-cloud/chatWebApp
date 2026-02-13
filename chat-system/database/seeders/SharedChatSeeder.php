<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\SocialAccount;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Str;

class SharedChatSeeder extends Seeder
{
    public function run()
    {
        // 1. Lấy TẤT CẢ nhân viên trong hệ thống
        $allStaff = User::all();

        if ($allStaff->isEmpty()) {
            $this->command->error('⚠️ Chưa có nhân viên nào (User). Hãy chạy UserSeeder trước!');
            return;
        }

        // 2. Tạo một Khách hàng "ngẫu nhiên" (Người sẽ chat với cả hệ thống)
        $customer = Customer::firstOrCreate(
            ['phone' => '0999999999'], // SĐT định danh
            [
                'full_name' => 'Khách Hàng Chung',
                'email' => 'shared_customer@example.com',
                'tags' => ['Hot', 'Cần tư vấn'],
                'source' => 'website_livechat'
            ]
        );

        // 3. Tạo tài khoản Web/MXH cho khách này
        $socialAccount = SocialAccount::firstOrCreate(
            ['social_id' => 'web_guest_' . rand(1000, 9999)],
            [
                'customer_id' => $customer->id,
                'platform' => 'website', // Giả sử chat từ Web
                'name' => 'Khách Vãng Lai (Web)',
                'avatar' => 'https://ui-avatars.com/api/?name=Khach+Chung&background=F44336&color=fff',
            ]
        );

        // 4. Tạo Cuộc hội thoại
        $conversation = Conversation::firstOrCreate(
            ['social_account_id' => $socialAccount->id],
            [
                'uuid' => Str::uuid(),
                'type' => 'website',
                'status' => 'open',
                'last_message_at' => now(),
            ]
        );

        // ==========================================================
        // QUAN TRỌNG NHẤT: Gán hội thoại này cho TẤT CẢ NHÂN VIÊN
        // ==========================================================
        foreach ($allStaff as $staff) {
            // Kiểm tra tránh trùng lặp
            if (!$conversation->users()->where('user_id', $staff->id)->exists()) {
                $conversation->users()->attach($staff->id, [
                    'is_assigned' => false, // false = Chưa ai "nhận" riêng, đây là chat chung
                    'joined_at' => now(),
                    'last_read_at' => null // Chưa đọc
                ]);
            }
        }

        // 5. Tạo kịch bản tin nhắn
        if ($conversation->messages()->count() == 0) {
            
            // Tin nhắn 1: Khách hỏi chung chung
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => null, // NULL = Khách hàng nhắn
                'body' => 'Alo shop ơi, có ai trực không?',
                'type' => 'text',
                'created_at' => now()->subMinutes(10),
            ]);

            // Tin nhắn 2: Một nhân viên A trả lời (Ví dụ người đầu tiên trong list)
            $firstResponder = $allStaff->first();
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $firstResponder->id, // Ghi rõ ID người trả lời
                'body' => 'Dạ chào bạn, bên mình đang trực đây ạ. Bạn cần hỗ trợ gì?',
                'type' => 'text',
                'created_at' => now()->subMinutes(8),
            ]);
            
            // Tin nhắn 3: Khách trả lời lại
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => null,
                'body' => 'Tư vấn giúp mình gói dịch vụ VIP với.',
                'type' => 'text',
                'created_at' => now()->subMinutes(5),
            ]);

            // Cập nhật lại snippet
            $conversation->update([
                'last_message' => 'Tư vấn giúp mình gói dịch vụ VIP với.',
                'last_message_at' => now()
            ]);
        }

        $this->command->info("✅ Đã tạo cuộc hội thoại chung! Tất cả " . $allStaff->count() . " nhân viên đều có thể thấy.");
    }
}