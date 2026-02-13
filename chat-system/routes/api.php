<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChatApiController;
use App\Http\Controllers\Api\SalesController; 
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Admin\Auth\LoginController;
use App\Http\Controllers\Api\FacebookWebhookController;

// =========================================================================
// API CHO MOBILE APP (Dùng Token Sanctum)
// =========================================================================

// 1. Public API
Route::post('/login', [LoginController::class, 'apiLogin']);

// Webhook Facebook (Không cần đăng nhập nên để ngoài middleware auth)
Route::get('/webhook/facebook', [FacebookWebhookController::class, 'verify']);
Route::post('/webhook/facebook', [FacebookWebhookController::class, 'handle']);

// 2. Protected API (Cần Token)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // User Info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/user/update-profile', [ChatApiController::class, 'updateProfile']);

    // --- CHAT ROUTES ---
    Route::get('/conversations', [ChatApiController::class, 'getConversations']);
    Route::post('/conversations/{id}/join', [ChatApiController::class, 'joinConversation']);
    Route::get('/conversations/{id}/messages', [ChatApiController::class, 'getMessages']);
    Route::post('/conversations/{id}/messages', [ChatApiController::class, 'sendMessage']);

    Route::post('/messages', [ChatApiController::class, 'sendMessage']); // New generic route
    Route::post('/conversations/check', [ChatApiController::class, 'checkOrCreateConversation']);
    Route::get('/users/search', [ChatApiController::class, 'searchUsers']);
    Route::post('/conversations/create', [ChatApiController::class, 'createGroup']);
    
    // Group Management
    Route::get('/conversations/{id}/members', [ChatApiController::class, 'getGroupMembers']);
    Route::put('/conversations/{id}/name', [ChatApiController::class, 'updateGroupName']);
    Route::post('/conversations/{id}/members', [ChatApiController::class, 'addMembers']);
    Route::delete('/conversations/{id}/members/{userId}', [ChatApiController::class, 'removeMember']);
    Route::post('/conversations/{id}/leave', [ChatApiController::class, 'leaveGroup']);
    Route::post('/conversations/{id}/add-staff', [ChatApiController::class, 'addMember']);
    Route::post('/conversations/{id}/add-member', [ChatApiController::class, 'addMember']); // Alias per request for "add-member"

    // TEST DEV ONLY
    Route::post('/test/customer-reply', [ChatApiController::class, 'simulateCustomerReply']);
    Route::get('/customers/{id}/history', [ChatApiController::class, 'getCustomerHistory']);

    // --- SALES / CRM ROUTES (MỚI THÊM) ---
    // (Dùng cho App quản lý bán hàng trên điện thoại)
    
    // Tìm sản phẩm
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/sales/products', [SalesController::class, 'searchProducts']);
    
    // Lấy thông tin khách & lịch sử đơn
    Route::get('/sales/customer/{id}', [SalesController::class, 'getCustomerStats']);
    
    // Tạo đơn hàng
    Route::post('/sales/orders', [SalesController::class, 'createOrder']);

    // --- ORDER ROUTES (CRM SIDEBAR) ---
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/customers/{id}/orders', [OrderController::class, 'index']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::put('/customers/{id}/tags', [CustomerController::class, 'updateTags']);

    // --- TASK ROUTES ---
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/customers/{id}/tasks', [TaskController::class, 'index']);
});

// --- 👇 DÁN ROUTE SỬA LỖI VÀO ĐÂY (KHU VỰC CÔNG CỘNG) ---
// Để tạm ở đây để Frontend gọi thoải mái mà không bị lỗi 401
Route::post('/conversations/{id}/read', [ChatApiController::class, 'markAsRead']);
