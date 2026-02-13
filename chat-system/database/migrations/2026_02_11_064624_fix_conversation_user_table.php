<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            // Thêm cột is_assigned nếu chưa có
            if (!Schema::hasColumn('conversation_user', 'is_assigned')) {
                $table->boolean('is_assigned')->default(false)->after('user_id'); 
            }

            // Thêm cột last_read_at nếu chưa có
            if (!Schema::hasColumn('conversation_user', 'last_read_at')) {
                $table->timestamp('last_read_at')->nullable()->after('is_assigned');
            }
        });
    }

    public function down(): void
    {
        Schema::table('conversation_user', function (Blueprint $table) {
            $table->dropColumn(['is_assigned', 'last_read_at']);
        });
    }
};