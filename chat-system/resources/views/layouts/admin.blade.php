<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Admin Portal') - QVC System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 text-gray-800" x-data="{ sidebarOpen: false }">

    <div class="flex h-screen overflow-hidden">
        
        {{-- 1. SIDEBAR (Dùng chung) --}}
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-20 hidden md:flex">
            {{-- Logo --}}
            <div class="h-16 flex items-center px-6 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="bg-blue-600 text-white p-1.5 rounded-lg"><i class="fas fa-cube text-lg"></i></div>
                    <h1 class="font-bold text-base text-gray-900">QVC Admin</h1>
                </div>
            </div>

            {{-- Menu --}}
            <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                <p class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tổng quan</p>
                
                {{-- Link Dashboard --}}
                <a href="{{ route('admin.dashboard') }}" 
                   class="flex items-center px-4 py-3 rounded-xl font-medium transition-colors mb-1
                   {{ request()->routeIs('admin.dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50' }}">
                    <i class="fas fa-chart-pie w-6"></i> <span>Dashboard</span>
                </a>

                {{-- Link Nhân sự --}}
                <a href="{{ route('admin.users.index') }}" 
                   class="flex items-center px-4 py-3 rounded-xl font-medium transition-colors mb-1
                   {{ request()->routeIs('admin.users.*') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50' }}">
                    <i class="fas fa-users w-6"></i> <span>Quản lý Nhân sự</span>
                </a>

                {{-- Link App Chat (Mở tab mới vì nó là app riêng) --}}
                <a href="{{ route('chat.index') }}" target="_blank" 
                   class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition mt-4">
                    <i class="fas fa-comments w-6 text-gray-400"></i> <span>Vào App Chat</span>
                </a>
            </nav>
            
            {{-- User Footer --}}
            <div class="p-4 border-t border-gray-100">
                <div class="flex items-center gap-3">
                    <img src="{{ Auth::user()->avatar_url }}" class="w-10 h-10 rounded-full border">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold truncate">{{ Auth::user()->name }}</p>
                        <p class="text-xs text-blue-600 font-bold uppercase truncate">{{ Auth::user()->getRoleNames()->first() }}</p>
                    </div>
                    <form action="{{ route('logout') }}" method="POST">
                        @csrf <button class="text-gray-400 hover:text-red-500"><i class="fas fa-sign-out-alt"></i></button>
                    </form>
                </div>
            </div>
        </aside>

        {{-- 2. MAIN CONTENT WRAPPER --}}
        <main class="flex-1 flex flex-col relative overflow-hidden">
            
            {{-- Header chung --}}
            <header class="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
                <h2 class="text-lg font-bold text-gray-800">@yield('header', 'Trung tâm điều khiển')</h2>
                <div class="flex items-center gap-4">
                    <span class="text-sm font-medium text-gray-600">{{ now()->format('d/m/Y') }}</span>
                </div>
            </header>

            {{-- NỘI DUNG THAY ĐỔI Ở ĐÂY --}}
            <div class="flex-1 overflow-auto p-8">
                @if(session('success'))
                    <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                        <i class="fas fa-check-circle mr-2"></i> {{ session('success') }}
                    </div>
                @endif
                
                @yield('content')
            </div>
        </main>
    </div>
</body>
</html>