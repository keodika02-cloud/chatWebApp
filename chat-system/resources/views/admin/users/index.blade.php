@extends('layouts.admin')

@section('title', 'Quản lý nhân sự')
@section('header', 'Danh sách nhân sự')

@section('content')
<div x-data="{ showAddModal: false }">
    
    {{-- Header Action --}}
    <div class="flex justify-between items-center mb-6">
        <p class="text-gray-500 text-sm">Quản lý tài khoản và phân quyền truy cập hệ thống.</p>
        <button @click="showAddModal = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2">
            <i class="fas fa-plus"></i> Thêm nhân viên
        </button>
    </div>

    {{-- Bảng User --}}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50 text-gray-600 text-xs uppercase border-b">
                <tr>
                    <th class="px-6 py-4">Nhân viên</th>
                    <th class="px-6 py-4">Phòng ban</th>
                    <th class="px-6 py-4">Vai trò</th>
                    <th class="px-6 py-4 text-right">Hành động</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @foreach($users as $user)
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4 flex items-center gap-3">
                        <img src="{{ $user->avatar_url }}" class="w-10 h-10 rounded-full border">
                        <div>
                            <div class="font-medium text-gray-900">{{ $user->name }}</div>
                            <div class="text-xs text-gray-500">{{ $user->email }}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-semibold border">{{ $user->department->code ?? 'N/A' }}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded text-xs font-bold uppercase border bg-gray-50 text-gray-700">
                            {{ $user->getRoleNames()->first() }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        @role('admin_dev')
                            @if($user->id !== Auth::id())
                            <form action="{{ route('admin.users.destroy', $user->id) }}" method="POST" class="inline" onsubmit="return confirm('Xóa?')">
                                @csrf @method('DELETE')
                                <button class="text-gray-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                            </form>
                            @endif
                        @endrole
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        <div class="p-4 border-t border-gray-100 bg-gray-50">
            {{ $users->links() }}
        </div>
    </div>

    {{-- MODAL THÊM MỚI --}}
    <div x-show="showAddModal" style="display: none;" class="fixed inset-0 z-50 overflow-y-auto" x-cloak>
        <div class="flex items-center justify-center min-h-screen px-4">
            <div class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" @click="showAddModal = false"></div>
            <div class="bg-white rounded-2xl shadow-xl transform transition-all sm:max-w-lg w-full relative z-10 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-900">Thêm nhân sự mới</h3>
                    <button @click="showAddModal = false" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
                </div>
                
                <form action="{{ route('admin.users.store') }}" method="POST" class="p-6">
                    @csrf
                    <div class="space-y-4">
                        {{-- Form fields --}}
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                            <input type="text" name="name" required class="w-full rounded-lg border-gray-300 border p-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" required class="w-full rounded-lg border-gray-300 border p-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                            <input type="password" name="password" required class="w-full rounded-lg border-gray-300 border p-2">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                                <select name="department_id" class="w-full rounded-lg border-gray-300 border p-2 bg-white">
                                    <option value="">-- Chọn --</option>
                                    @foreach($departments as $dept)
                                        <option value="{{ $dept->id }}">{{ $dept->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                <select name="role" required class="w-full rounded-lg border-gray-300 border p-2 bg-white">
                                    @foreach($roles as $role)
                                        @if($role->name != 'customer') 
                                            <option value="{{ $role->name }}">{{ $role->name }}</option>
                                        @endif
                                    @endforeach
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end gap-3">
                        <button type="button" @click="showAddModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    @if($errors->any())
        <script>document.addEventListener('alpine:init', () => { Alpine.store('showAddModal', true); });</script>
    @endif
</div>
@endsection