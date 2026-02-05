@extends('layouts.admin')

@section('title', 'Dashboard')
@section('header', 'Tổng quan hệ thống')

@section('content')
    {{-- CÁC Ô THỐNG KÊ --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-3xl font-bold text-gray-900">{{ $stats['total_users'] }}</h3>
            <p class="text-sm text-gray-500">Tổng nhân sự</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-3xl font-bold text-gray-900">{{ $stats['online_users'] }}</h3>
            <p class="text-sm text-gray-500">Đang Online</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-3xl font-bold text-gray-900">{{ $stats['today_messages'] }}</h3>
            <p class="text-sm text-gray-500">Tin nhắn hôm nay</p>
        </div>
        @role('admin_dev')
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-3xl font-bold text-gray-900">{{ $stats['server_status'] }}</h3>
            <p class="text-sm text-gray-500">Hệ thống</p>
        </div>
        @endrole
    </div>

    {{-- BẢNG NHÂN VIÊN MỚI (Tùy chọn hiển thị ở đây cho đẹp) --}}
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 class="font-bold text-gray-800">Nhân sự mới gia nhập</h3>
            <a href="{{ route('admin.users.index') }}" class="text-sm text-blue-600 hover:underline">Xem tất cả quản lý</a>
        </div>
        {{-- (Code table đơn giản hoặc để trống) --}}
    </div>
@endsection