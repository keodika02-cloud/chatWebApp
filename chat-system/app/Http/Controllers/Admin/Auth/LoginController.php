<?php

namespace App\Http\Controllers\Admin\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    // Hiển thị form đăng nhập
    public function showLoginForm()
    {
        return view('login'); // Trỏ đến file resources/views/login.blade.php
    }

    // Xử lý đăng nhập
    public function login(Request $request)
    {
        // 1. Validate dữ liệu
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // 2. Thử đăng nhập (kèm chức năng Remember Me)
        if (Auth::attempt($credentials, $request->filled('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();

            // 3. LOGIC CHUYỂN HƯỚNG THÔNG MINH
            // Nếu là Sếp (Admin/Manager) -> Vào trang Admin
            if ($user->hasAnyRole(['admin_dev', 'manager'])) {
                return redirect()->intended(route('admin.dashboard'));
            }

            // Nếu là Nhân viên/Khách -> Vào trang Chat
            return redirect()->intended(route('chat.index'));
        }

        // 4. Nếu sai -> Trả về lỗi
        return back()->withErrors([
            'email' => 'Thông tin đăng nhập không chính xác.',
        ])->onlyInput('email');
    }

    // API Login for React Client
    public function apiLogin(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);
        }

        return response()->json([
            'message' => 'Invalid login details'
        ], 401);
    }

    // Đăng xuất
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }
}