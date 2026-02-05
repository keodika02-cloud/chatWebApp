<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Dọn dẹp cache của Spatie để tránh lỗi
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. ĐỊNH NGHĨA DANH SÁCH QUYỀN (PERMISSIONS)
        // Chúng ta tạo các nhóm quyền nhỏ (Atomic Permissions)
        $permissions = [
            // Quyền hệ thống (Technical)
            'view_telescope', // Xem log lỗi, debug
            'view_server_stats', // Xem CPU/RAM
            
            // Quyền quản trị (Management)
            'access_admin_panel', // Được vào trang /admin
            'manage_all_users',   // Thêm/Sửa/Xóa tất cả user
            'manage_department_users', // Chỉ sửa user trong phòng mình
            
            // Quyền chat (Basic)
            'use_chat_system', // Được nhắn tin
            'create_group_chat', // Được tạo nhóm
            'upload_files', // Được gửi file
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 3. ĐỊNH NGHĨA 4 CẤP ĐỘ VAI TRÒ (ROLES) & GÁN QUYỀN

        // --- CẤP 4: NHÂN VIÊN (Employee) ---
        // Chỉ được chat cơ bản
        $roleEmployee = Role::firstOrCreate(['name' => 'employee']);
        $roleEmployee->syncPermissions([
            'use_chat_system',
            'upload_files'
        ]);

        // --- CẤP 3: TRƯỞNG PHÒNG (Manager) ---
        // Chat + Được vào Admin + Quản lý nhân viên phòng mình
        $roleManager = Role::firstOrCreate(['name' => 'manager']);
        $roleManager->syncPermissions([
            'use_chat_system',
            'create_group_chat',
            'upload_files',
            'access_admin_panel',
            'manage_department_users'
        ]);

        // --- CẤP 2: GIÁM ĐỐC (Director) ---
        // Chat + Quản lý TẤT CẢ nhân sự + Xem báo cáo (Không được xem log kỹ thuật)
        $roleDirector = Role::firstOrCreate(['name' => 'director']);
        $roleDirector->syncPermissions([
            'use_chat_system',
            'create_group_chat',
            'upload_files',
            'access_admin_panel',
            'manage_all_users',
        ]);

        // --- CẤP 1: SUPER ADMIN (Dev/Owner) ---
        // Full quyền (Bao gồm cả quyền kỹ thuật)
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        // Super Admin thường được bypass mọi check, nhưng gán full cho chắc
        $roleSuperAdmin->syncPermissions(Permission::all());

        echo "✅ Đã thiết lập xong 4 cấp độ phân quyền!\n";
    }
}