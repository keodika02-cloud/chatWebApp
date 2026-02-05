HYBRID ARCHITECTURE: CUSTOM BLADE ADMIN + INERTIA CLIENT



Mô hình: Hybrid Monolith

Mục tiêu: Kiểm soát hoàn toàn giao diện Admin (Thủ công) và Tối ưu trải nghiệm Client (App-like).



1\. TECH STACK CHI TIẾT



Chúng ta sử dụng 2 công nghệ View khác nhau trong cùng 1 dự án Laravel:



Thành phần



Admin Portal (Server Quản lý)



Client App (Ứng dụng Chat)



URL Base



yourdomain.com/admin



yourdomain.com/



Công nghệ View



Laravel Blade + Tailwind CSS



Vue 3 (Thông qua Inertia.js)



Cách tiếp cận



Truyền thống (MPA): Reload trang khi chuyển link



Hiện đại (SPA): Không reload trang



Ngôn ngữ chính



PHP \& HTML



JavaScript/TypeScript + PHP API



State



Server-side (Session)



Client-side (Pinia)



Auth



Laravel Auth (Session/Cookie)



Laravel Sanctum (Token) / Session



Routing



routes/web.php (Group Admin)



routes/web.php (Group Client)



2\. CẤU TRÚC THƯ MỤC (PHÂN TÁCH RÕ RÀNG)



Dự án được chia thành 2 luồng Controller và View riêng biệt:



app/

├── Http/

│   ├── Controllers/

│   │   ├── Admin/          # \[VƯƠNG QUỐC ADMIN] - Trả về view('admin.\*')

│   │   │   ├── Auth/LoginController.php

│   │   │   ├── DashboardController.php

│   │   │   ├── UserController.php

│   │   │   └── ...

│   │   │

│   │   ├── Client/         # \[VƯƠNG QUỐC CLIENT] - Trả về Inertia::render()

│   │   │   ├── ChatController.php

│   │   │   └── ...

│   │   └── Api/            # API cho Mobile App

│

resources/

├── views/

│   ├── admin/              # \[ADMIN VIEW] (Blade Templates)

│   │   ├── layouts/        # Layout Admin (Sidebar, Header)

│   │   ├── users/          # CRUD User (index, create, edit.blade.php)

│   │   └── dashboard.blade.php

│   │

│   └── app.blade.php       # Root View cho Inertia Client

│

├── js/                     # \[CLIENT VIEW] (Vue.js)

│   ├── Pages/              # Giao diện Chat Vue

│   ├── Components/

│   └── Stores/             # Pinia Store





3\. TRIỂN KHAI PHẦN ADMIN (THỦ CÔNG - BLADE)



Bạn sẽ xây dựng Admin Panel giống như làm một trang web Laravel cơ bản.



3.1. Routes (routes/web.php)



Tạo một nhóm route riêng cho Admin với prefix /admin.



use App\\Http\\Controllers\\Admin\\DashboardController;

use App\\Http\\Controllers\\Admin\\UserController;



// Route cho Admin

Route::prefix('admin')

&nbsp;   ->name('admin.')

&nbsp;   ->middleware(\['auth', 'role:admin\_dev|manager']) // Chỉ cho Sếp vào

&nbsp;   ->group(function () {

&nbsp;       

&nbsp;       // Dashboard

&nbsp;       Route::get('/dashboard', \[DashboardController::class, 'index'])->name('dashboard');

&nbsp;       

&nbsp;       // Quản lý User (CRUD)

&nbsp;       Route::resource('users', UserController::class);

&nbsp;       

&nbsp;       // Quản lý Phòng ban

&nbsp;       Route::resource('departments', DepartmentController::class);

&nbsp;   });





3.2. Controller (app/Http/Controllers/Admin/UserController.php)



Viết logic thủ công để lấy dữ liệu và trả về Blade View.



public function index()

{

&nbsp;   $users = User::with('department')->paginate(10);

&nbsp;   // Trả về file blade: resources/views/admin/users/index.blade.php

&nbsp;   return view('admin.users.index', compact('users'));

}



public function create()

{

&nbsp;   return view('admin.users.create');

}



public function store(Request $request)

{

&nbsp;   // Validate và tạo User mới

&nbsp;   User::create($request->validated());

&nbsp;   return redirect()->route('admin.users.index')->with('success', 'Tạo thành công');

}





3.3. View (resources/views/admin/users/index.blade.php)



Bạn tự viết HTML/CSS (dùng Tailwind) để hiển thị bảng dữ liệu.



@extends('admin.layouts.app')



@section('content')

&nbsp;   <div class="container mx-auto px-4">

&nbsp;       <h1 class="text-2xl font-bold mb-4">Danh sách Nhân viên</h1>

&nbsp;       

&nbsp;       <table class="min-w-full bg-white border">

&nbsp;           <thead>

&nbsp;               <tr>

&nbsp;                   <th class="py-2 px-4 border-b">Tên</th>

&nbsp;                   <th class="py-2 px-4 border-b">Email</th>

&nbsp;                   <th class="py-2 px-4 border-b">Phòng ban</th>

&nbsp;                   <th class="py-2 px-4 border-b">Hành động</th>

&nbsp;               </tr>

&nbsp;           </thead>

&nbsp;           <tbody>

&nbsp;               @foreach($users as $user)

&nbsp;               <tr>

&nbsp;                   <td class="py-2 px-4 border-b">{{ $user->name }}</td>

&nbsp;                   <td class="py-2 px-4 border-b">{{ $user->email }}</td>

&nbsp;                   <td class="py-2 px-4 border-b">{{ $user->department->name ?? '-' }}</td>

&nbsp;                   <td class="py-2 px-4 border-b">

&nbsp;                       <a href="{{ route('admin.users.edit', $user) }}" class="text-blue-500">Sửa</a>

&nbsp;                   </td>

&nbsp;               </tr>

&nbsp;               @endforeach

&nbsp;           </tbody>

&nbsp;       </table>

&nbsp;       

&nbsp;       <!-- Phân trang -->

&nbsp;       <div class="mt-4">

&nbsp;           {{ $users->links() }}

&nbsp;       </div>

&nbsp;   </div>

@endsection





4\. TRIỂN KHAI PHẦN CLIENT (INERTIA + VUE)



Phần Client giữ nguyên công nghệ hiện đại (Vue.js) để đảm bảo trải nghiệm Chat tốt nhất.



4.1. Routes



Tách biệt khỏi nhóm Admin.



Route::middleware(\['auth', 'role:employee|manager|customer'])->group(function () {

&nbsp;   Route::get('/', \[ChatController::class, 'index'])->name('chat.index');

});





4.2. Controller (app/Http/Controllers/Client/ChatController.php)



public function index()

{

&nbsp;   // Trả về Inertia Component: resources/js/Pages/Chat/Index.vue

&nbsp;   return Inertia::render('Chat/Index', \[

&nbsp;       'conversations' => auth()->user()->conversations,

&nbsp;   ]);

}





5\. LƯU Ý KHI LÀM THỦ CÔNG



5.1. Authentication (Đăng nhập)



Bạn cần xây dựng 2 màn hình Login (hoặc dùng chung 1 màn hình nhưng redirect khác nhau).



Gợi ý: Sử dụng Laravel Breeze (bản Blade) để cài đặt sẵn tính năng Login/Register cơ bản, sau đó sửa lại giao diện cho phần Admin.



5.2. Build Assets (Vite Config)



Vì Admin dùng Blade (Server-side) còn Client dùng Vue (Client-side), bạn cần cấu hình Vite để build cả CSS cho Blade và JS cho Vue.



// vite.config.js

import { defineConfig } from 'vite';

import laravel from 'laravel-vite-plugin';

import vue from '@vitejs/plugin-vue';



export default defineConfig({

&nbsp;   plugins: \[

&nbsp;       laravel({

&nbsp;           input: \[

&nbsp;               'resources/css/app.css', // CSS chung (Tailwind) cho cả Admin \& Client

&nbsp;               'resources/js/app.js',   // JS chính cho Vue App

&nbsp;           ],

&nbsp;           refresh: true,

&nbsp;       }),

&nbsp;       vue({

&nbsp;           template: {

&nbsp;               transformAssetUrls: {

&nbsp;                   base: null,

&nbsp;                   includeAbsolute: false,

&nbsp;               },

&nbsp;           },

&nbsp;       }),

&nbsp;   ],

});





5.3. Layout Admin



Bạn nên tìm một Tailwind Admin Template miễn phí (HTML thuần) để copy vào resources/views/admin/layouts/app.blade.php. Đừng tự code CSS từ đầu cho Sidebar/Header để tiết kiệm thời gian.



6\. KẾT LUẬN



Với kiến trúc Thủ công này:



Kiểm soát 100%: Bạn biết chính xác từng dòng code trong Admin hoạt động thế nào.



Linh hoạt: Muốn sửa giao diện bảng, thêm nút bấm lạ, hay logic phức tạp đều dễ dàng hơn so với việc phải override lại Filament.



Học hỏi: Bạn sẽ hiểu sâu hơn về cơ chế hoạt động của Laravel (Routing, Controller, Blade, Middleware).

