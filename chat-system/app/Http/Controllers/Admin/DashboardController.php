<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Message;
use App\Models\Department; // <--- Thêm
use Spatie\Permission\Models\Role; // <--- Thêm

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Số liệu thống kê
        $stats = [
            'total_users' => User::count(),
            'online_users' => User::where('last_seen_at', '>=', now()->subMinutes(5))->count(),
            'today_messages' => Message::whereDate('created_at', today())->count(),
            'server_status' => 'Stable',
        ];

        // 2. Danh sách nhân viên (Thay vì chỉ lấy 5, ta lấy paginate 10 người)
        $users = User::with(['department', 'roles'])->latest()->paginate(10);
        
        // 3. Dữ liệu cho Modal "Thêm mới"
        $departments = Department::all();
        $roles = Role::all();

        return view('admin.dashboard', compact('stats', 'users', 'departments', 'roles'));
    }
}