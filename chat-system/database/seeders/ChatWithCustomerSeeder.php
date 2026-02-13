<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\SocialAccount;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Str;

class ChatWithCustomerSeeder extends Seeder
{
    public function run()
    {
        // 1. Xác định Nhân viên sẽ chat (Lấy ID = 1 hoặc user đầu tiên)
        $staff = User::first();
        if (!$staff) {
            $this->command->info('⚠️ Chưa có nhân viên nào (User). Hãy chạy UserSeeder trước!');
            return;
        }

        // 2. Tìm hoặc Tạo Khách hàng (Customer)
        $customer = Customer::firstOrCreate(
            ['email' => 'khachhang@example.com'], // Điều kiện tìm
            [
                'full_name' => 'Nguyễn Văn Khách',
                'phone' => '0987654321',
                'tags' => ['VIP', 'Mới'], // Giả sử bạn có cột tags cast array
                'source' => 'facebook_ads'
            ]
        );

        // 3. Tạo tài khoản MXH giả (Ví dụ khách này chat từ Facebook)
        $socialAccount = SocialAccount::firstOrCreate(
            ['social_id' => 'fb_fake_id_999'], // ID Facebook giả định
            [
                'customer_id' => $customer->id,
                'platform' => 'facebook',
                'name' => 'Nick Face Của Khách',
                'avatar' => 'https://ui-avatars.com/api/?name=Khach+Hang&background=random',
            ]
        );

        // 4. Tạo Cuộc hội thoại (Conversation)
        $conversation = Conversation::firstOrCreate(
            ['social_account_id' => $socialAccount->id],
            [
                'uuid' => Str::uuid(),
                'type' => 'facebook', // Loại hội thoại
                'status' => 'open',
                'last_message_at' => now(),
                // Nếu bảng conversations của bạn có cột uuid, hãy thêm dòng này:
                // 'uuid' => Str::uuid(), 
            ]
        );

        // 5. Gán Nhân viên vào cuộc hội thoại (Quan trọng!)
        // Kiểm tra xem nhân viên đã có trong hội thoại chưa để tránh lỗi trùng
        if (!$conversation->users()->where('user_id', $staff->id)->exists()) {
            $conversation->users()->attach($staff->id, [
                'is_assigned' => true,
                'joined_at' => now(),
                'last_read_at' => now()
            ]);
        }

        // 6. Tạo Tin nhắn mẫu (Messages)
        // Nếu chưa có tin nhắn nào thì mới tạo
        if ($conversation->messages()->count() == 0) {
            
            // Tin nhắn 1: Khách hàng hỏi (user_id = NULL)
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => null, // NULL nghĩa là Khách hàng nhắn
                'body' => 'Chào shop, áo mẫu này còn size L không ạ?',
                'type' => 'text',
                'created_at' => now()->subMinutes(10),
            ]);

            // Tin nhắn 2: Nhân viên trả lời (user_id = ID nhân viên)
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $staff->id, // Có ID nghĩa là Nhân viên nhắn
                'body' => 'Dạ chào bạn, mẫu này bên mình còn hàng nhé!',
                'type' => 'text',
                'created_at' => now()->subMinutes(5),
            ]);
            
            // Tin nhắn 3: Khách hàng chốt đơn
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => null,
                'body' => 'Ok chốt cho mình 1 cái nhé.',
                'type' => 'text',
                'created_at' => now(),
            ]);

            // Cập nhật lại last_message cho hội thoại
            $conversation->update([
                'last_message' => 'Ok chốt cho mình 1 cái nhé.',
                'last_message_at' => now()
            ]);
        }

        $this->command->info("✅ Đã tạo cuộc hội thoại mẫu thành công cho nhân viên: " . $staff->name);
    }
}