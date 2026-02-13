<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Customer;
use App\Models\SocialAccount;

class FacebookWebhookController extends Controller
{
    private $pageAccessToken;

    public function __construct()
    {
        $this->pageAccessToken = config('services.facebook.page_access_token');
    }
    /**
     * XÁC MINH WEBHOOK (GET)
     * Facebook gọi hàm này khi bạn bấm nút "Verify and Save"
     */
    public function verify(Request $request)
    {
        $token = $request->input('hub_verify_token');
        $challenge = $request->input('hub_challenge');
        $mode = $request->input('hub_mode');

        $verifyToken = config('services.facebook.verify_token');

        // Kiểm tra mã bí mật
        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('Facebook Webhook Verified!');
            return response($challenge, 200);
        }

        Log::error('Facebook Webhook Verify Failed', ['expected' => $verifyToken, 'got' => $token]);
        return response('Forbidden', 403);
    }

    /**
     * NHẬN TIN NHẮN (POST)
     * Facebook gọi hàm này khi có tin nhắn mới
     */
    public function handle(Request $request)
    {
        $data = $request->all();

        // Kiểm tra xem có phải sự kiện từ Page không
        if (isset($data['object']) && $data['object'] === 'page') {
            
            // Duyệt qua các sự kiện (thường chỉ có 1)
            foreach ($data['entry'] as $entry) {
                foreach ($entry['messaging'] as $event) {
                    if (isset($event['message']) && isset($event['sender']['id'])) {
                        // Gọi hàm xử lý lưu tin nhắn
                        $this->receiveMessage($event);
                    }
                }
            }

            // Trả về 200 OK ngay lập tức (Bắt buộc)
            return response('EVENT_RECEIVED', 200);
        }

        return response('Not Found', 404);
    }

    /**
     * LOGIC LƯU VÀO DATABASE
     */
    private function receiveMessage($event)
    {
        try {
            $senderId = $event['sender']['id']; // ID khách trên FB
            $messageText = $event['message']['text'] ?? '[Hình ảnh/Sticker]';

            // 1. Tìm hoặc tạo Social Account (Liên kết với bảng Customer)
            $social = SocialAccount::where('social_id', $senderId)->where('platform', 'facebook')->first();
            $isNewUser = false;

            if (!$social) {
                $isNewUser = true;
                // Tạo Customer mới
                $customer = Customer::create([
                    'full_name' => 'New Facebook User',
                    'phone' => null,
                    'pipeline_stage' => 'new'
                ]);

                // Tạo SocialAccount mới
                $social = SocialAccount::create([
                    'customer_id' => $customer->id,
                    'social_id' => $senderId,
                    'platform' => 'facebook',
                    'name' => 'New Facebook User',
                    'avatar' => "https://graph.facebook.com/$senderId/picture?type=normal"
                ]);
            }

            // 2. Tìm hoặc tạo Hội thoại
            $conversation = Conversation::firstOrCreate(
                ['social_account_id' => $social->id],
                [
                    'type' => 'facebook',
                    'status' => 'open',
                    'last_message' => $messageText,
                    'last_message_at' => now(),
                ]
            );

            // 3. Lưu tin nhắn vào bảng messages
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => null, // null nghĩa là khách nhắn
                'body' => $messageText,
                'type' => 'text'
            ]);

            // 4. Update hội thoại để nó nhảy lên đầu
            $conversation->update([
                'last_message' => $messageText,
                'last_message_at' => now()
            ]);
            
            // Increment unread_count (nếu cột tồn tại)
            try {
                $conversation->increment('unread_count');
            } catch (\Exception $e) {}

            // 5. Fetch User Profile (Crucial)
            // SAU KHI LƯU TIN NHẮN XONG -> GỌI HÀM LẤY INFO NGAY
            // (Bất kể khách cũ hay mới đều cập nhật lại cho chắc)
            $this->updateFacebookInfo($senderId, $social);

            // 6. Realtime Trigger
            try {
                 broadcast(new \App\Events\MessageSent($message))->toOthers();
            } catch (\Exception $e) {
                 Log::error("Broadcast error: " . $e->getMessage());
            }

            Log::info("Đã lưu tin nhắn từ FB: $senderId");

        } catch (\Exception $e) {
            Log::error("Lỗi lưu tin nhắn FB: " . $e->getMessage());
        }
    }

    // HÀM LẤY INFO (Dán vào cuối file Controller)
    private function updateFacebookInfo($senderId, $socialAccount)
    {
        $token = $this->pageAccessToken; 
        
        try {
            // 1. Gọi API lấy field 'picture.width(500)' để lấy ảnh nét và link thật
            $url = "https://graph.facebook.com/$senderId?fields=first_name,last_name,picture.width(500).redirect(false)&access_token=$token";
            
            $response = Http::get($url);
            
            if ($response->successful()) {
                $data = $response->json();
                $name = trim(($data['last_name'] ?? '') . ' ' . ($data['first_name'] ?? ''));
                
                // 2. LẤY LINK ẢNH THẬT (QUAN TRỌNG)
                // Cấu trúc JSON trả về là: picture -> data -> url
                $avatarUrl = $data['picture']['data']['url'] ?? null;

                // 3. Lưu link 'scontent...' này vào Database
                $socialAccount->update([
                    'name' => $name,
                    'avatar' => $avatarUrl 
                ]);

                // Đồng bộ sang bảng Customer
                if ($socialAccount->customer && str_contains($socialAccount->customer->full_name, 'New Facebook User')) {
                    $socialAccount->customer->update(['full_name' => $name]);
                }
                
                Log::info("Đã cập nhật Avatar xịn cho: $name");
            } else {
                Log::error("Lỗi gọi Facebook API: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Lỗi lấy Avatar: " . $e->getMessage());
        }
    }
}