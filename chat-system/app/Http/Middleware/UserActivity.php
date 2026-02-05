<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class UserActivity
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            // Cập nhật thời gian active mà không làm thay đổi updated_at của user
            // Dùng timestamps = false để tối ưu
            $user = Auth::user();
            $user->timestamps = false;
            $user->last_seen_at = now();
            $user->save();
        }

        return $next($request);
    }
}