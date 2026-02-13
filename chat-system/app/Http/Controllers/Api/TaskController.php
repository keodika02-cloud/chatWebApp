<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'title' => 'required|string',
            'due_date' => 'required|date',
            'assigned_to' => 'required|exists:users,id',
            'description' => 'nullable|string'
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
                return response()->json(['message' => 'Bạn không có quyền tạo nhắc việc cho khách hàng này'], 403);
            }
        }

        $task = \App\Models\Task::create([
            'customer_id' => $validated['customer_id'],
            'title' => $validated['title'],
            'due_date' => $validated['due_date'],
            'assigned_to' => $validated['assigned_to'],
            'description' => $validated['description'] ?? null,
            'created_by' => auth()->id(),
            'status' => 'pending'
        ]);

        return response()->json($task);
    }

    public function index($customerId)
    {
        // BẢO MẬT: Kiểm tra quyền truy cập của nhân viên
        $user = auth()->user();
        
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

        return \App\Models\Task::where('customer_id', $customerId)
            ->with('assignee')
            ->orderBy('due_date')
            ->get();
    }
}
