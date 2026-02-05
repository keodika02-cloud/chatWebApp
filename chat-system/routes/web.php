<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Auth\LoginController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Client\ChatController;
use App\Http\Controllers\Api\ChatApiController;

// =========================================================================
// 1. GUEST ROUTES (Dành cho người chưa đăng nhập)
// =========================================================================
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// =========================================================================
// 2. AUTH ROUTES (Dành cho người ĐÃ đăng nhập)
// =========================================================================
Route::middleware(['auth'])->group(function () {

    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

    // --- CLIENT CHAT APP ---
    Route::get('/', [ChatController::class, 'index'])->name('chat.index');

    // --- AJAX API (QUAN TRỌNG: ĐÂY LÀ PHẦN BẠN ĐANG THIẾU) ---
    Route::prefix('ajax')->group(function() {
        // 1. Lấy danh sách hội thoại cũ
        Route::get('/conversations', [ChatApiController::class, 'getConversations']);
        
        // 2. Lấy nội dung tin nhắn
        Route::get('/conversations/{id}/messages', [ChatApiController::class, 'getMessages']);
        
        // 3. Gửi tin nhắn mới (ĐANG THIẾU)
        Route::post('/conversations/{id}/messages', [ChatApiController::class, 'sendMessage']);
        
        // 4. Tìm kiếm đồng nghiệp (ĐANG THIẾU -> Nguyên nhân lỗi tìm kiếm)
        Route::get('/users/search', [ChatApiController::class, 'searchUsers']);
        
        // 5. Tạo cuộc hội thoại mới (ĐANG THIẾU)
        Route::post('/conversations/check', [ChatApiController::class, 'checkOrCreateConversation']);
    });
});

// =========================================================================
// 3. ADMIN PORTAL
// =========================================================================
Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'role:admin_dev|manager']) 
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::resource('users', UserController::class);
    });