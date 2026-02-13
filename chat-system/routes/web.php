<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Auth\LoginController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Client\ChatController;
use App\Http\Controllers\Api\ChatApiController;
use App\Http\Controllers\Api\SalesController; // <--- 1. THÊM DÒNG NÀY

// =========================================================================
// 1. GUEST ROUTES
// =========================================================================
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// =========================================================================
// 2. AUTH ROUTES
// =========================================================================
Route::middleware(['auth'])->group(function () {

    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

    // --- CLIENT CHAT APP ---
    Route::get('/', [ChatController::class, 'index'])->name('chat.index');

    // --- AJAX API ---
    Route::prefix('ajax')->group(function() {
        // --- Chat Routes (Cũ) ---
        Route::get('/conversations', [ChatApiController::class, 'getConversations']);
        Route::get('/conversations/{id}/messages', [ChatApiController::class, 'getMessages']);
        Route::post('/conversations/{id}/messages', [ChatApiController::class, 'sendMessage']);
        Route::post('/conversations/{id}/read', [ChatApiController::class, 'markAsRead']);
        Route::get('/users/search', [ChatApiController::class, 'searchUsers']);
        Route::post('/conversations/check', [ChatApiController::class, 'checkOrCreateConversation']);
        Route::post('/conversations/create', [ChatApiController::class, 'createGroup']);

        // Group Management
        Route::get('/conversations/{id}/members', [ChatApiController::class, 'getGroupMembers']);
        Route::put('/conversations/{id}/name', [ChatApiController::class, 'updateGroupName']);
        Route::post('/conversations/{id}/members', [ChatApiController::class, 'addMembers']);
        Route::delete('/conversations/{id}/members/{userId}', [ChatApiController::class, 'removeMember']);
        Route::post('/conversations/{id}/leave', [ChatApiController::class, 'leaveGroup']);

        // --- 2. SALES / CRM ROUTES (MỚI THÊM VÀO ĐÂY) ---
        // Tìm kiếm sản phẩm
        Route::get('/sales/products', [SalesController::class, 'searchProducts']);
        
        // Lấy thông tin khách hàng & lịch sử đơn
        Route::get('/sales/customer/{id}', [SalesController::class, 'getCustomerStats']);
        
        // Tạo đơn hàng mới
        Route::post('/sales/orders', [SalesController::class, 'createOrder']);
        Route::post('/sales/customer/{id}/update', [SalesController::class, 'updateCustomerProfile']);
        
        Route::get('/customers/{id}/history', [ChatApiController::class, 'getCustomerHistory']);
        Route::put('/customers/{id}', [\App\Http\Controllers\Api\CustomerController::class, 'update']);
        Route::put('/customers/{id}/tags', [\App\Http\Controllers\Api\CustomerController::class, 'updateTags']);
        
        Route::post('/tasks', [\App\Http\Controllers\Api\TaskController::class, 'store']);
        Route::get('/customers/{id}/tasks', [\App\Http\Controllers\Api\TaskController::class, 'index']);

        Route::post('/orders', [\App\Http\Controllers\Api\OrderController::class, 'store']);
        Route::get('/customers/{id}/orders', [\App\Http\Controllers\Api\OrderController::class, 'index']);

        // --- 3. EMPLOYEE / FRIENDS ROUTES ---
        Route::get('/users/internal', [ChatApiController::class, 'getInternalUsers']);
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