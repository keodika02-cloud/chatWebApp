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
// 1. create_departments_table
Schema::create('departments', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('code')->unique(); // VD: IT, HR, SALE
    $table->unsignedBigInteger('manager_id')->nullable(); // Trưởng phòng
    $table->timestamps();
});

// 2. update_users_table (Thêm vào migration mặc định)
Schema::table('users', function (Blueprint $table) {
    $table->string('avatar_url')->nullable();
    
    // Hierarchy & Organization
    $table->foreignId('department_id')->nullable()->constrained();
    $table->foreignId('parent_id')->nullable()->constrained('users'); // Người tạo
    
    // Status
    $table->boolean('is_active')->default(true);
    $table->timestamp('last_seen_at')->nullable();
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
public function down(): void
{
    // BƯỚC 1: Cắt đứt quan hệ ở bảng users trước
    // Kiểm tra nếu bảng users có tồn tại thì mới xóa khóa ngoại
    if (Schema::hasTable('users')) {
        Schema::table('users', function (Blueprint $table) {
            // Xóa khóa ngoại và cột department_id
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });
    }

    // BƯỚC 2: Sau đó mới được xóa bảng departments
    Schema::dropIfExists('departments');
}
};
