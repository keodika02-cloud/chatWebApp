<?php

// app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // API: POST /api/orders
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'conversation_id' => 'nullable|exists:conversations,id',
            'items' => 'required|array', 
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = auth()->user();
        if (!$user->hasRole('admin_dev|manager')) {
            $hasAccess = DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $validated['customer_id'])
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền tạo đơn cho khách hàng này'], 403);
            }
        }

        try {
            DB::beginTransaction();

            // 1. Tính tổng tiền
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['price'];
            }

            // 2. Tạo Order
            $order = Order::create([
                'user_id' => auth()->id(), 
                'customer_id' => $validated['customer_id'],
                'conversation_id' => $request->conversation_id ?? null, // Lưu conversation_id
                'total_amount' => $totalAmount,
                'status' => 'pending', 
            ]);

            // 3. Tạo Order Items
            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    // 'product_id' => $item['product_id'] ?? null, 
                ]);
            }

            DB::commit();

            return response()->json(['message' => 'Tạo đơn thành công', 'order' => $order]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo đơn: ' . $e->getMessage()], 500);
        }
    }
    
    // API: GET /api/customers/{id}/orders (Lấy lịch sử đơn hàng)
    public function index($customerId)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = auth()->user();
        
        // Nếu không phải admin/manager, chỉ cho phép xem nếu có tham gia vào ít nhất 1 cuộc hội thoại của khách này
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

        $orders = Order::where('customer_id', $customerId)
            ->with('items')
            ->orderByDesc('created_at')
            ->get();
            
        return response()->json($orders);
    }
}
