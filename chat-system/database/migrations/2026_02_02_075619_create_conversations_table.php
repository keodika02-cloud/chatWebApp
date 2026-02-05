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
    Schema::create('conversations', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->string('name')->nullable();
        $table->string('avatar_url')->nullable();
        
        // --- SỬA ĐOẠN NÀY ---
        // Đổi từ enum(...) thành string() để linh hoạt, tránh lỗi MySQL
        $table->string('type')->default('direct')->index();
        // --------------------

        $table->enum('status', ['open', 'resolved', 'pending'])->default('open');
        $table->timestamp('last_message_at')->nullable()->index();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
