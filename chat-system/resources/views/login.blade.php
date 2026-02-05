<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - QVC System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">

    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {{-- Header --}}
        <div class="bg-blue-600 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-blue-600 mb-4 shadow-sm">
                <i class="fas fa-cube text-3xl"></i>
            </div>
            <h2 class="text-2xl font-bold text-white">QVC Enterprise</h2>
            <p class="text-blue-100 text-sm mt-1">Hệ thống quản trị nội bộ</p>
        </div>

        {{-- Form --}}
        <div class="p-8">
            {{-- Thông báo lỗi --}}
            @if ($errors->any())
                <div class="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        @foreach ($errors->all() as $error)
                            <p>{{ $error }}</p>
                        @endforeach
                    </div>
                </div>
            @endif

            <form action="{{ route('login') }}" method="POST">
                @csrf
                
                <div class="mb-5">
                    <label class="block text-gray-700 text-sm font-bold mb-2 ml-1">Email công ty</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-envelope text-gray-400"></i>
                        </div>
                        <input type="email" name="email" value="{{ old('email') }}" required autofocus
                            class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="user@company.com">
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2 ml-1">Mật khẩu</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-lock text-gray-400"></i>
                        </div>
                        <input type="password" name="password" required
                            class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••">
                    </div>
                </div>

                <div class="flex items-center justify-between mb-6">
                    <label class="flex items-center text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" name="remember" class="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
                        <span class="ml-2">Ghi nhớ đăng nhập</span>
                    </label>
                    <a href="#" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Quên mật khẩu?</a>
                </div>

                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center gap-2">
                    <span>Đăng nhập</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
            </form>
        </div>
        
        <div class="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
            <p class="text-xs text-gray-500">&copy; {{ date('Y') }} Máy Tính Quốc Việt. All rights reserved.</p>
        </div>
    </div>

</body>
</html>