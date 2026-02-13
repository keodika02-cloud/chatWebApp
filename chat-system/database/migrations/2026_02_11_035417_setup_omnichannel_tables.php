<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. TẠO BẢNG KHÁCH HÀNG (CUSTOMERS - CRM GỐC)
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('full_name')->default('Khách hàng');
                $table->string('phone')->nullable()->index(); // Index để tìm nhanh khi gộp khách
                $table->string('email')->nullable();
                $table->string('address')->nullable();
                $table->text('notes')->nullable(); // Ghi chú nội bộ
                $table->json('tags')->nullable(); // Ví dụ: ["VIP", "Sỉ"]
                $table->string('pipeline_stage')->default('new'); // Trạng thái: new, potential, won...
                $table->timestamps();
            });
        }

        // 2. TẠO BẢNG TÀI KHOẢN MXH (SOCIAL ACCOUNTS)
        if (!Schema::hasTable('social_accounts')) {
            Schema::create('social_accounts', function (Blueprint $table) {
                $table->id();
                // Liên kết với bảng customers ở trên
                $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
                
                $table->string('platform'); // facebook, zalo, telegram, web
                $table->string('social_id')->index(); // ID người dùng trên MXH (PSID, Zalo ID...)
                $table->string('name'); // Tên hiển thị trên MXH
                $table->string('avatar')->nullable();
                $table->timestamps();

                // Đảm bảo 1 ID trên 1 nền tảng là duy nhất
                $table->unique(['platform', 'social_id']);
            });
        }

        // 3. CẬP NHẬT BẢNG CONVERSATIONS (HỘI THOẠI)
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                // Thêm cột liên kết với Social Account (Nullable để tránh lỗi dữ liệu cũ)
                if (!Schema::hasColumn('conversations', 'social_account_id')) {
                    $table->foreignId('social_account_id')->nullable()->constrained('social_accounts')->onDelete('set null');
                }
                
                // Thêm cột định danh Fanpage/OA nhận tin
                if (!Schema::hasColumn('conversations', 'page_id')) {
                    $table->string('page_id')->nullable();
                }

                // Thêm cột trạng thái hội thoại (Mở/Đóng)
                if (!Schema::hasColumn('conversations', 'status')) {
                    $table->string('status')->default('open'); 
                }
            });
        }

        // 4. TẠO BẢNG TRUNG GIAN NHÂN VIÊN - HỘI THOẠI (MANY-TO-MANY)
        // Bảng này thay thế cho việc 1 hội thoại chỉ thuộc về 1 user
        if (!Schema::hasTable('conversation_user')) {
            Schema::create('conversation_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Nhân viên
                
                $table->boolean('is_assigned')->default(false); // Người chịu trách nhiệm chính
                $table->timestamp('last_read_at')->nullable(); // Đánh dấu đã đọc đến đâu
                $table->timestamps();

                // Một nhân viên không thể tham gia 2 lần vào 1 hội thoại
                $table->unique(['conversation_id', 'user_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_user');
        
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                $table->dropForeign(['social_account_id']);
                $table->dropColumn(['social_account_id', 'page_id', 'status']);
            });
        }

        Schema::dropIfExists('social_accounts');
        Schema::dropIfExists('customers');
    }
};