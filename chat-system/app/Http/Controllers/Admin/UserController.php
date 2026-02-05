<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // Danh sách nhân viên
    public function index()
    {
        $currentUser = Auth::user();
        
        // Eager load 'roles' và 'department' để tránh query N+1
        $query = User::with(['department', 'roles'])->latest();

        // --- LOGIC PHÂN QUYỀN ---
        // 1. Admin Dev: Thấy tất cả.
        // 2. Manager: Chỉ thấy Nhân viên (Employee), KHÔNG thấy Admin/Manager khác.
        if (!$currentUser->hasRole('admin_dev')) {
            $query->whereHas('roles', function ($q) {
                $q->where('name', 'employee'); 
            });
            
            // Nếu muốn Manager chỉ quản lý nhân viên PHÒNG MÌNH thì mở comment dòng dưới:
            // if ($currentUser->department_id) {
            //     $query->where('department_id', $currentUser->department_id);
            // }
        }

        $users = $query->paginate(10);
        
        // Dữ liệu cho Modal (Manager chỉ được chọn role Employee)
        $departments = Department::all();
        
        if ($currentUser->hasRole('admin_dev')) {
             $roles = Role::all();
        } else {
             // Manager chỉ được cấp quyền Employee cho người mới
             $roles = Role::where('name', 'employee')->get();
        }

        return view('admin.users.index', compact('users', 'departments', 'roles'));
    }

    // Form thêm mới
    public function create()
    {
        $departments = Department::all();
        $roles = Role::all();
        return view('admin.users.create', compact('departments', 'roles'));
    }

    // Lưu nhân viên mới
    public function store(Request $request)
    {
        // Manager không được tạo Admin/Manager khác
        if (!Auth::user()->hasRole('admin_dev') && in_array($request->role, ['admin_dev', 'manager'])) {
            return back()->withErrors(['role' => 'Bạn không đủ quyền tạo Admin/Manager!']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'department_id' => 'nullable|exists:departments,id',
            'role' => 'required|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'department_id' => $validated['department_id'],
            'avatar_url' => 'https://ui-avatars.com/api/?name=' . urlencode($validated['name']),
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', 'Đã thêm nhân viên thành công!');
    }

    // Form sửa
    public function edit(User $user)
    {
        $departments = Department::all();
        $roles = Role::all();
        return view('admin.users.edit', compact('user', 'departments', 'roles'));
    }

    // Cập nhật
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role' => 'required|exists:roles,name',
        ]);

        $user->update([
            'name' => $validated['name'],
            'department_id' => $validated['department_id'],
        ]);

        // Cập nhật lại quyền (Xóa quyền cũ, gán quyền mới)
        $user->syncRoles($validated['role']);

        return redirect()->route('admin.users.index')->with('success', 'Cập nhật thành công!');
    }

    // Xóa nhân viên
    public function destroy(User $user)
    {
        // Manager KHÔNG ĐƯỢC XÓA
        if (!Auth::user()->hasRole('admin_dev')) {
            return back()->withErrors(['error' => 'Chỉ Admin cao nhất mới được xóa tài khoản!']);
        }

        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'Không thể tự xóa chính mình!']);
        }

        $user->delete();
        return back()->with('success', 'Đã xóa nhân viên.');
    }
}