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
        // 1. Bảng Nhắc việc (Tasks)
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_to')->constrained('users'); // Người phụ trách
            $table->foreignId('created_by')->constrained('users');
            $table->string('title'); // Tiêu đề
            $table->text('description')->nullable();
            $table->dateTime('due_date')->nullable(); // Hạn
            $table->enum('status', ['pending', 'done', 'expired'])->default('pending');
            $table->timestamps();
        });

        // 2. Cập nhật bảng Orders (cho giống ảnh đơn hàng)
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'shipping_fee')) {
                $table->decimal('shipping_fee', 15, 2)->default(0); // Phí vận chuyển
                $table->decimal('discount', 15, 2)->default(0); // Giảm giá
                $table->string('payment_method')->default('COD'); // COD, Banking
                $table->text('internal_note')->nullable(); // Ghi chú nội bộ
                $table->string('shipping_address')->nullable(); // Địa chỉ giao hàng
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_fee',
                'discount',
                'payment_method',
                'internal_note',
                'shipping_address'
            ]);
        });
    }


};
