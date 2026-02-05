<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\DB;

class ChatContentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Đảm bảo có ít nhất 2 user
        $myUser = User::find(1); // User admin của bạn
        $otherUser = User::find(2); // Đồng nghiệp

        // Nếu chưa có user 2 thì tạo đại
        if (!$otherUser) {
            $otherUser = User::factory()->create([
                'name' => 'Nguyễn Văn A',
                'email' => 'nhanvien@company.com',
                'password' => bcrypt('password'),
            ]);
        }

        // 2. Tạo cuộc hội thoại giữa 2 người
        // Kiểm tra xem đã có hội thoại chưa, chưa thì tạo
        $conversation = Conversation::create([
            'name' => null, // Chat 1-1 thường không đặt tên nhóm
            'type' => 'internal_direct', // 'direct' hoặc 'group'
        ]);

        // Gắn 2 user vào cuộc hội thoại (Bảng trung gian conversation_user)
        // Giả sử bạn dùng hàm attach() của relationship
        $conversation->users()->attach([$myUser->id, $otherUser->id]);

        // 3. Tạo 20 tin nhắn qua lại
        $messages = [
            ['Hello sếp, dự án đến đâu rồi ạ?', $otherUser->id],
            ['Chào em, anh đang cấu hình server, sắp xong rồi.', $myUser->id],
            ['Vâng, server có chạy Docker không anh?', $otherUser->id],
            ['Có chứ, anh đang setup Docker với Laravel Sail.', $myUser->id],
            ['Tuyệt vời! Em có thể vào test thử chưa?', $otherUser->id],
            ['Đợi anh push code lên đã nhé.', $myUser->id],
            ['Dạ vâng, khi nào xong ping em nhé.', $otherUser->id],
            ['Ok em. À mà task UI hôm qua em sửa chưa?', $myUser->id],
            ['Em sửa rồi ạ, anh F5 lại xem sao.', $otherUser->id],
            ['Ok để anh xem... Ùi đẹp đấy!', $myUser->id],
        ];

        foreach ($messages as $index => $msg) {
            Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $msg[1], // Người gửi
                'body' => $msg[0],    // Nội dung
                'type' => 'text',
                'created_at' => now()->subMinutes(10 - $index), // Thời gian ảo
            ]);
        }

        echo "✅ Đã tạo xong dữ liệu chat giả lập!\n";
    }
}