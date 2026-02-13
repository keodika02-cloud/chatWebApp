<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Conversation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\CustomerProfile;
use App\Models\User;

class SalesController extends Controller
{
    // 1. Tìm kiếm sản phẩm
    public function searchProducts(Request $request)
    {
        $query = $request->get('q');
        $products = Product::where('name', 'like', "%{$query}%")
            ->limit(20)
            ->get();
        return response()->json($products);
    }



    // 3. TẠO ĐƠN HÀNG + GỬI BILL VÀO CHAT
    public function createOrder(Request $request)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = Auth::user();
        if (!$user->hasRole('admin_dev|manager')) {
            $hasAccess = DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $request->customer_id)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền tạo đơn cho khách hàng này'], 403);
            }
        }

        try {
            DB::beginTransaction();

            $order = Order::create([
                'user_id' => Auth::id(),
                'customer_id' => $request->customer_id, // ID của người đang chat cùng
                'conversation_id' => $request->conversation_id,
                'total_amount' => $request->total_amount,
                'status' => 'pending'
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'product_name' => $item['name'],
                    'quantity' => $item['qty'],
                    'price' => $item['price']
                ]);
            }

            // Tự động tạo tin nhắn dạng "Hóa đơn" gửi vào đoạn chat
            $conversation = Conversation::find($request->conversation_id);
            if ($conversation) {
                // Chúng ta dùng type 'order' để frontend render ra cái Bill đẹp
                $msgBody = "Đã tạo đơn hàng #" . $order->id . " - Tổng: " . number_format($order->total_amount) . "đ";
                
                $message = $conversation->messages()->create([
                    'user_id' => Auth::id(),
                    'body' => $msgBody, 
                    'type' => 'text', // Hoặc 'order' nếu bạn đã sửa ChatWindow để render bill
                    // Nếu bạn chưa sửa ChatWindow để nhận type='order', cứ để text trước.
                    // Tốt nhất là thêm cột 'metadata' json vào bảng messages để lưu chi tiết đơn.
                ]);
                
                // Update conversation time
                $conversation->update(['last_message_at' => now()]);
                
                // Broadcast event (nếu có dùng Pusher)
                try { broadcast(new \App\Events\MessageSent($message))->toOthers(); } catch (\Exception $e) {}
            }

            DB::commit();
            return response()->json(['status' => 'success', 'order' => $order]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    // 1. CẬP NHẬT HÀM LẤY THÔNG TIN (getCustomerStats)
    public function getCustomerStats($customerId)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = Auth::user();
        if (!$user->hasRole('admin_dev|manager')) {
            $hasAccess = DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $customerId)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền xem thông tin khách hàng này'], 403);
            }
        }

        // Lấy đơn hàng cũ
        $orders = Order::where('customer_id', $customerId)
            ->with('items')
            ->latest()
            ->get();
            
        // Lấy hoặc tạo Profile CRM
        $profile = CustomerProfile::firstOrCreate(
            ['customer_id' => $customerId],
            ['source' => 'web', 'pipeline_stage' => 'new']
        );

        return response()->json([
            'orders' => $orders,
            'total_spent' => $orders->sum('total_amount'),
            'order_count' => $orders->count(),
            'profile' => $profile 
        ]);
    }

    // 2. HÀM MỚI: CẬP NHẬT THÔNG TIN KHÁCH
    public function updateCustomerProfile(Request $request, $customerId)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = Auth::user();
        if (!$user->hasRole('admin_dev|manager')) {
            $hasAccess = DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $customerId)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền cập nhật thông tin khách hàng này'], 403);
            }
        }

        $profile = CustomerProfile::where('customer_id', $customerId)->firstOrFail();
        
        $profile->update($request->only([
            'phone', 'email', 'address', 'pipeline_stage', 'notes', 'tags'
        ]));

        return response()->json(['status' => 'success', 'profile' => $profile]);
    }
}