<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Enums\ConversationType;
use Illuminate\Support\Str;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Dọn dẹp cache
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. TẠO ROLE
        $roleAdmin    = Role::firstOrCreate(['name' => 'admin_dev']); 
        $roleManager  = Role::firstOrCreate(['name' => 'manager']);
        $roleEmployee = Role::firstOrCreate(['name' => 'employee']);
        $roleCustomer = Role::firstOrCreate(['name' => 'customer']);

        // 3. TẠO QUYỀN
        $permissions = [
            'access_admin_panel', 'view_server_stats', 'manage_users', 
            'use_chat_system', 'upload_files'
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        // Gán quyền
        $roleManager->syncPermissions(['access_admin_panel', 'manage_users', 'use_chat_system', 'upload_files']);
        $roleEmployee->syncPermissions(['use_chat_system', 'upload_files']);
        $roleCustomer->syncPermissions(['use_chat_system']);

        // 4. TẠO PHÒNG BAN
        $deptIT = Department::firstOrCreate(['code' => 'IT'], ['name' => 'Công nghệ (IT)']);
        $deptSale = Department::firstOrCreate(['code' => 'SALE'], ['name' => 'Kinh Doanh']);
        $deptHR = Department::firstOrCreate(['code' => 'HR'], ['name' => 'Nhân Sự']);

        $password = Hash::make('password');

        // 5. TẠO USER CHÍNH (CORE)
        // Admin
        $admin = User::firstOrCreate(['email' => 'admin@company.com'], [
            'name' => 'Super Admin',
            'password' => $password,
            'department_id' => $deptIT->id,
            'avatar_url' => 'https://ui-avatars.com/api/?name=Admin+Dev&background=000&color=fff',
        ]);
        $admin->assignRole($roleAdmin);

        // Manager IT
        $manager = User::firstOrCreate(['email' => 'manager@company.com'], [
            'name' => 'Trưởng Phòng IT',
            'password' => $password,
            'department_id' => $deptIT->id,
            'parent_id' => $admin->id,
            'avatar_url' => 'https://ui-avatars.com/api/?name=Manager&background=0D8ABC&color=fff',
        ]);
        $manager->assignRole($roleManager);

        // Dev A (Employee)
        $dev = User::firstOrCreate(['email' => 'dev@company.com'], [
            'name' => 'Lập trình viên A',
            'password' => $password,
            'department_id' => $deptIT->id,
            'parent_id' => $manager->id,
            'avatar_url' => 'https://ui-avatars.com/api/?name=Dev+A&background=random',
        ]);
        $dev->assignRole($roleEmployee);

        // 6. TẠO 20 NHÂN VIÊN GIẢ LẬP (MỚI THÊM)
        $firstNames = ['Tuấn', 'Hùng', 'Lan', 'Mai', 'Đạt', 'Sơn', 'Hương', 'Giang', 'Phương', 'Linh'];
        $lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];

        for ($i = 1; $i <= 20; $i++) {
            // Random tên
            $randomName = $lastNames[array_rand($lastNames)] . ' ' . $firstNames[array_rand($firstNames)];
            $email = "user{$i}@company.com"; // user1@company.com, user2...

            // Random phòng ban
            $randomDept = match(rand(1, 3)) {
                1 => $deptIT,
                2 => $deptSale,
                3 => $deptHR,
            };

            if (!User::where('email', $email)->exists()) {
                $u = User::create([
                    'name' => $randomName,
                    'email' => $email,
                    'password' => $password,
                    'department_id' => $randomDept->id,
                    'parent_id' => $manager->id,
                    'avatar_url' => 'https://ui-avatars.com/api/?name=' . urlencode($randomName) . '&background=random',
                    'is_active' => true,
                ]);
                $u->assignRole($roleEmployee);
            }
        }

        // 7. TẠO HỘI THOẠI MẪU
        // Chat giữa Manager và Dev
        $exists = Conversation::whereHas('users', function ($q) use ($manager) {
            $q->where('users.id', $manager->id);
        })->whereHas('users', function ($q) use ($dev) {
            $q->where('users.id', $dev->id);
        })->exists();

        if (!$exists) {
            $conv = Conversation::create(['type' => ConversationType::DIRECT]);
            $conv->users()->attach([$manager->id, $dev->id]);
            
            Message::create([
                'conversation_id' => $conv->id,
                'user_id' => $manager->id,
                'body' => 'Dev A, data nhiều thế này test search sướng nhé!',
                'type' => 'text',
                'created_at' => now()->subMinutes(2),
            ]);
        }

        echo "✅ Đã tạo xong: Admin, Manager, Dev + 20 Nhân viên ảo!\n";
    }
}