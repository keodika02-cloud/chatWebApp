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
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('user_id'); // Người bán (Sales)
        $table->unsignedBigInteger('customer_id')->nullable(); // Khách hàng (User đang chat)
        $table->unsignedBigInteger('conversation_id'); // Gắn với đoạn chat nào
        $table->decimal('total_amount', 15, 0);
        $table->string('status')->default('pending'); // pending, paid, cancelled
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
