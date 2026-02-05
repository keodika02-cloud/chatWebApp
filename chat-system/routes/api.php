<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChatApiController;
use App\Http\Controllers\Admin\Auth\LoginController; // Tận dụng controller cũ hoặc tạo mới

// =========================================================================
// API CHO MOBILE APP (Dùng Token Sanctum)
// =========================================================================

// 1. Public API (Đăng nhập lấy Token)
Route::post('/login', [LoginController::class, 'apiLogin']); // Ta sẽ viết thêm hàm này

// 2. Protected API (Cần Token)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Lấy thông tin người dùng hiện tại
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Chat Data
    Route::get('/conversations', [ChatApiController::class, 'getConversations']);
    Route::get('/conversations/{id}/messages', [ChatApiController::class, 'getMessages']);
    Route::post('/conversations/{id}/messages', [ChatApiController::class, 'sendMessage']);
    Route::post('/conversations/check', [ChatApiController::class, 'checkOrCreateConversation']);
    Route::get('/users/search', [ChatApiController::class, 'searchUsers']);
});