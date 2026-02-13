<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;

use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Update the specified resource in storage.
     * API: PUT /api/customers/{id}
     */
    public function update(Request $request, $id)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = auth()->user();
        if (!$user->hasRole('admin_dev|manager')) {
            $hasAccess = DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $id)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền cập nhật thông tin khách hàng này'], 403);
            }
        }

        $customer = Customer::findOrFail($id);
        
        $customer->update($request->only([
            'notes', 
            'pipeline_stage', 
            'phone', 
            'email'
        ]));

        return response()->json(['message' => 'Cập nhật thành công', 'customer' => $customer]);
    }

    public function updateTags(Request $request, $id)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = auth()->user();
        if (!$user->hasRole('admin_dev|manager')) {
             $hasAccess = DB::table('conversation_user')
                ->join('conversations', 'conversation_user.conversation_id', '=', 'conversations.id')
                ->join('social_accounts', 'conversations.social_account_id', '=', 'social_accounts.id')
                ->where('conversation_user.user_id', $user->id)
                ->where('social_accounts.customer_id', $id)
                ->exists();

            if (!$hasAccess) {
                return response()->json(['message' => 'Bạn không có quyền cập nhật tags khách hàng này'], 403);
            }
        }

        $customer = Customer::findOrFail($id);
        // Giả sử tags lưu dạng JSON trong bảng customers
        $customer->tags = $request->tags; // Array ['VIP', 'Mới']
        $customer->save();
        return response()->json(['message' => 'Cập nhật tags thành công']);
    }
}
