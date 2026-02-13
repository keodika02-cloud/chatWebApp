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
    Schema::table('conversations', function (Blueprint $table) {
        // 1. Cột loại hội thoại (Nếu chưa có, hoặc sửa enum nếu cần)
        // Các giá trị: 'private' (1-1), 'group' (nhóm), 'facebook', 'zalo'...
        if (!Schema::hasColumn('conversations', 'type')) {
            $table->string('type')->default('private')->index(); 
        }

        // 2. Tên nhóm (VD: "Hội ăn trưa", "Dự án A") - Chat 1-1 thì để null
        if (!Schema::hasColumn('conversations', 'name')) {
            $table->string('name')->nullable();
        }

        // 3. Ảnh nhóm (Avatar riêng của nhóm)
        if (!Schema::hasColumn('conversations', 'avatar')) {
            $table->string('avatar')->nullable();
        }

        // 4. Trưởng nhóm (Người có quyền kick thành viên, đổi tên nhóm)
        if (!Schema::hasColumn('conversations', 'owner_id')) {
            $table->unsignedBigInteger('owner_id')->nullable();
        }
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
