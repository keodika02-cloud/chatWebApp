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
    Schema::table('messages', function (Blueprint $table) {
        $table->string('attachment_path')->nullable()->after('body'); // Đường dẫn file
        $table->string('attachment_type')->nullable()->after('attachment_path'); // Loại: image, file, video...
        $table->string('attachment_name')->nullable()->after('attachment_type'); // Tên gốc của file
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            //
        });
    }
};
