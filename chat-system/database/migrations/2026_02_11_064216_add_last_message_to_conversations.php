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
        // Kiểm tra nếu chưa có thì thêm vào
        if (!Schema::hasColumn('conversations', 'last_message')) {
            $table->text('last_message')->nullable()->after('status');
        }
        
        // Thêm luôn cột thời gian tin nhắn cuối (nếu chưa có) để sắp xếp chat
        if (!Schema::hasColumn('conversations', 'last_message_at')) {
            $table->timestamp('last_message_at')->nullable()->after('last_message');
        }
    });
}

public function down()
{
    Schema::table('conversations', function (Blueprint $table) {
        $table->dropColumn(['last_message', 'last_message_at']);
    });
}
};
