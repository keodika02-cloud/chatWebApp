<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::create('customer_profiles', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('customer_id')->unique(); // ID của user khách hàng
        
        // Thông tin liên hệ
        $table->string('phone')->nullable();
        $table->string('email')->nullable();
        $table->string('address')->nullable();
        
        // Thông tin CRM
        $table->string('source')->default('unknown'); // facebook, zalo, web
        $table->string('pipeline_stage')->default('new'); // new, potential, negotiated, won, lost
        $table->json('tags')->nullable(); // Lưu mảng: ["VIP", "Bom hàng"]
        $table->text('notes')->nullable(); // Ghi chú nội bộ
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};
