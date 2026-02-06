<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            // 1. Chỉ thêm cột 'name' nếu chưa có
            if (!Schema::hasColumn('conversations', 'name')) {
                $table->string('name')->nullable()->after('id');
            }

            // 2. Chỉ thêm cột 'type' nếu chưa có
            if (!Schema::hasColumn('conversations', 'type')) {
                $table->string('type')->default('private')->after('name');
            }

            // 3. Xử lý cột Avatar (Cũ là avatar_url, mới là avatar)
            if (!Schema::hasColumn('conversations', 'avatar')) {
                $table->string('avatar')->nullable()->after('type');
            }

            // 4. Thêm các cột mới cho Group Chat
            if (!Schema::hasColumn('conversations', 'owner_id')) {
                $table->unsignedBigInteger('owner_id')->nullable()->after('type');
            }
            if (!Schema::hasColumn('conversations', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('owner_id');
            }
        });

        // 5. Tạo bảng trung gian: conversation_user (Để biết ai đang ở trong nhóm nào)
        if (!Schema::hasTable('conversation_user')) {
            Schema::create('conversation_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('role')->default('member'); // admin, member
                $table->timestamp('joined_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        // Khi rollback thì xóa các cột đã thêm
        Schema::table('conversations', function (Blueprint $table) {
            if (Schema::hasColumn('conversations', 'owner_id')) $table->dropColumn('owner_id');
            if (Schema::hasColumn('conversations', 'department_id')) $table->dropColumn('department_id');
            if (Schema::hasColumn('conversations', 'avatar')) $table->dropColumn('avatar');
        });
        Schema::dropIfExists('conversation_user');
    }
};