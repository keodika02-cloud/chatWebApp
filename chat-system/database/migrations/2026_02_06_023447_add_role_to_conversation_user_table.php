<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            // Kiểm tra nếu chưa có cột 'role' thì mới thêm
            if (!Schema::hasColumn('conversation_user', 'role')) {
                $table->string('role')->default('member')->after('user_id');
            }
            // Tiện thể kiểm tra luôn cột 'joined_at'
            if (!Schema::hasColumn('conversation_user', 'joined_at')) {
                $table->timestamp('joined_at')->useCurrent()->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            if (Schema::hasColumn('conversation_user', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};