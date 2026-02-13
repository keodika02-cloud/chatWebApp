<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // 1. Thêm cột 'source' (Nguồn khách: Facebook, Zalo...)
            if (!Schema::hasColumn('customers', 'source')) {
                $table->string('source')->nullable()->after('phone');
            }

            // 2. Thêm cột 'tags' (Phân loại: VIP, Mới...)
            if (!Schema::hasColumn('customers', 'tags')) {
                $table->json('tags')->nullable()->after('source'); 
                // Lưu ý: Nếu MariaDB version cũ quá không hỗ trợ json thì đổi thành $table->text('tags')
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['source', 'tags']);
        });
    }
};