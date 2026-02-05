TECHNICAL IMPLEMENTATION GUIDE



Based on: PROJECT MASTER BLUEPRINT v4.2

Target: Backend Developer (Laravel)



1\. DATABASE SCHEMA (MIGRATIONS)



Dưới đây là danh sách các bảng cần tạo. Hãy chạy lệnh php artisan make:migration tương ứng.



1.1. Core Identity \& Auth



Table: departments



Schema::create('departments', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->string('name');

&nbsp;   $table->string('code')->unique(); // VD: IT, HR, SALE

&nbsp;   $table->unsignedBigInteger('manager\_id')->nullable(); // Trưởng phòng

&nbsp;   $table->timestamps();

});





Table: users



Schema::create('users', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->string('name');

&nbsp;   $table->string('email')->unique();

&nbsp;   $table->string('password');

&nbsp;   $table->string('avatar\_url')->nullable();

&nbsp;   

&nbsp;   // Hierarchy \& Organization

&nbsp;   $table->foreignId('department\_id')->nullable()->constrained();

&nbsp;   $table->foreignId('parent\_id')->nullable()->constrained('users'); // Người tạo (Manager)

&nbsp;   

&nbsp;   // Status

&nbsp;   $table->boolean('is\_active')->default(true);

&nbsp;   $table->timestamp('last\_seen\_at')->nullable();

&nbsp;   

&nbsp;   $table->rememberToken();

&nbsp;   $table->timestamps();

&nbsp;   $table->softDeletes(); // Admin có thể khôi phục

});





Table: user\_devices (Push Notification)



Schema::create('user\_devices', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->foreignId('user\_id')->constrained()->cascadeOnDelete();

&nbsp;   $table->string('platform'); // 'android', 'ios', 'web'

&nbsp;   $table->string('fcm\_token', 500); // Token dài

&nbsp;   $table->timestamp('last\_active\_at')->useCurrent();

&nbsp;   $table->unique(\['user\_id', 'fcm\_token']); // Tránh trùng lặp

});





1.2. Core Chat System



Table: conversations



Schema::create('conversations', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->uuid('uuid')->unique(); // Public ID

&nbsp;   $table->string('name')->nullable(); // Tên nhóm (null nếu chat 1-1)

&nbsp;   $table->string('avatar\_url')->nullable();

&nbsp;   

&nbsp;   // Types defined in Blueprint

&nbsp;   $table->enum('type', \['internal\_direct', 'internal\_group', 'customer\_support']);

&nbsp;   $table->enum('status', \['open', 'resolved', 'pending'])->default('open'); // Cho Support Ticket

&nbsp;   

&nbsp;   $table->timestamp('last\_message\_at')->nullable()->index(); // Sort index

&nbsp;   $table->timestamps();

});





Table: conversation\_user (Pivot)



Schema::create('conversation\_user', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->foreignId('conversation\_id')->constrained()->cascadeOnDelete();

&nbsp;   $table->foreignId('user\_id')->constrained()->cascadeOnDelete();

&nbsp;   

&nbsp;   $table->boolean('is\_admin')->default(false); // Trưởng nhóm

&nbsp;   $table->timestamp('last\_read\_at')->nullable(); // Marker đã đọc

&nbsp;   

&nbsp;   $table->unique(\['conversation\_id', 'user\_id']);

&nbsp;   $table->index(\['user\_id', 'last\_read\_at']); // Tối ưu query unread count

});





Table: messages



Schema::create('messages', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->uuid('uuid')->unique(); // Optimistic UI ID

&nbsp;   $table->foreignId('conversation\_id')->constrained()->cascadeOnDelete();

&nbsp;   $table->foreignId('user\_id')->nullable()->constrained(); // Nullable nếu là System Message

&nbsp;   

&nbsp;   $table->enum('type', \['text', 'image', 'file', 'system'])->default('text');

&nbsp;   $table->text('body')->nullable(); // Nội dung tin nhắn

&nbsp;   

&nbsp;   $table->timestamps();

&nbsp;   

&nbsp;   // Index tối ưu cho Cursor Pagination: Lấy tin nhắn của hội thoại X, sắp xếp theo thời gian

&nbsp;   $table->index(\['conversation\_id', 'created\_at']);

});





1.3. Enhancements



Table: attachments



Schema::create('attachments', function (Blueprint $table) {

&nbsp;   $table->id();

&nbsp;   $table->foreignId('message\_id')->constrained()->cascadeOnDelete();

&nbsp;   $table->foreignId('user\_id')->constrained();

&nbsp;   

&nbsp;   $table->string('disk')->default('local'); // local, s3

&nbsp;   $table->string('file\_path'); // private/chats/2024/...

&nbsp;   $table->string('file\_name'); // original\_name.pdf

&nbsp;   $table->bigInteger('file\_size');

&nbsp;   $table->string('mime\_type');

&nbsp;   

&nbsp;   $table->timestamps();

});





2\. DANH SÁCH CONTROLLERS (PROJECT STRUCTURE)



Cấu trúc thư mục app/Http/Controllers phải tách biệt rõ ràng.



2.1. Client API (/api/client/)



Dành cho Mobile App \& Web App của Nhân viên/Khách hàng.



Controller File



Mục đích chính



AuthController.php



Login, Logout, Refresh Token, Get Profile (me).



ChatController.php



Lấy danh sách hội thoại, Tạo chat 1-1, Update trạng thái read.



MessageController.php



Lấy tin nhắn (cursor), Gửi tin nhắn, Recall tin nhắn.



GroupController.php



Tạo nhóm, Thêm/Xóa thành viên, Đổi ảnh nhóm.



AttachmentController.php



Upload file, Generate Signed URL (Download).



TicketController.php



Dành cho Customer tạo yêu cầu hỗ trợ.



DeviceController.php



Đăng ký/Hủy đăng ký FCM Token.



2.2. Admin API (/api/admin/)



Dành cho Dashboard Quản trị.



Controller File



Mục đích chính



AdminAuthController.php



Login vào trang Admin.



DashboardController.php



Số liệu thống kê (CCU, Message Count).



UserController.php



CRUD User, Reset Password, Set Role.



DepartmentController.php



Quản lý phòng ban.



LogController.php



Xem activity\_log (Audit).



3\. API ENDPOINTS SPECS \& JSON SAMPLES



Dưới đây là đặc tả cho các API quan trọng nhất phía Client.



3.1. Authentication



POST /api/client/login



Input: { "email": "...", "password": "...", "device\_name": "iPhone 13" }



Output: Token Sanctum.



3.2. Chat Listing (Danh sách hội thoại)



GET /api/client/conversations



Response JSON:



{

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "id": 101,

&nbsp;     "uuid": "550e8400-e29b-41d4-a716-446655440000",

&nbsp;     "type": "internal\_direct",

&nbsp;     "name": "Nguyễn Văn A", // Với chat 1-1, đây là tên người kia

&nbsp;     "avatar": "\[https://cdn.company.com/avatars/user-5.jpg](https://cdn.company.com/avatars/user-5.jpg)",

&nbsp;     "last\_message": {

&nbsp;       "body": "Ok sếp, em gửi báo cáo ngay.",

&nbsp;       "type": "text",

&nbsp;       "created\_at": "2023-10-27T10:30:00+07:00",

&nbsp;       "sender\_name": "Nguyễn Văn B"

&nbsp;     },

&nbsp;     "unread\_count": 2,

&nbsp;     "updated\_at": "2023-10-27T10:30:00+07:00"

&nbsp;   },

&nbsp;   {

&nbsp;     "id": 102,

&nbsp;     "uuid": "uuid-group-marketing",

&nbsp;     "type": "internal\_group",

&nbsp;     "name": "Marketing Team",

&nbsp;     "avatar": "\[https://cdn.company.com/groups/marketing.jpg](https://cdn.company.com/groups/marketing.jpg)",

&nbsp;     "unread\_count": 0,

&nbsp;     "updated\_at": "2023-10-27T09:00:00+07:00"

&nbsp;   }

&nbsp; ]

}





3.3. Get Messages (Cursor Pagination - QUAN TRỌNG)



GET /api/client/conversations/{id}/messages



Params: ?cursor=eyJpZCI6... (Cursor lấy từ response trước đó).



Response JSON:



{

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "id": 5002,

&nbsp;     "uuid": "msg-uuid-1",

&nbsp;     "type": "text",

&nbsp;     "body": "File thiết kế đây nhé mọi người",

&nbsp;     "created\_at": "2023-10-27T10:35:00+07:00",

&nbsp;     "sender": {

&nbsp;       "id": 10,

&nbsp;       "name": "Designer C",

&nbsp;       "avatar": "..."

&nbsp;     },

&nbsp;     "is\_self": false

&nbsp;   },

&nbsp;   {

&nbsp;     "id": 5001,

&nbsp;     "uuid": "msg-uuid-2",

&nbsp;     "type": "file",

&nbsp;     "body": null,

&nbsp;     "attachment": {

&nbsp;       "id": 88,

&nbsp;       "file\_name": "Final\_Design\_v3.pdf",

&nbsp;       "file\_size": 5242880,

&nbsp;       "file\_type": "application/pdf",

&nbsp;       "download\_url": "\[https://api.company.com/attachments/88/download?signature=](https://api.company.com/attachments/88/download?signature=)..." 

&nbsp;       // URL này là Signed URL, hết hạn sau 30p

&nbsp;     },

&nbsp;     "created\_at": "2023-10-27T10:34:00+07:00",

&nbsp;     "sender": {

&nbsp;       "id": 10,

&nbsp;       "name": "Designer C",

&nbsp;       "avatar": "..."

&nbsp;     },

&nbsp;     "is\_self": false

&nbsp;   }

&nbsp; ],

&nbsp; "links": {

&nbsp;   "first": "...",

&nbsp;   "next": "\[http://api.company.com/.../messages?cursor=eyJpZCI6NTAwMS](http://api.company.com/.../messages?cursor=eyJpZCI6NTAwMS)...",

&nbsp;   "prev": null

&nbsp; },

&nbsp; "meta": {

&nbsp;   "path": "...",

&nbsp;   "per\_page": 20,

&nbsp;   "next\_cursor": "eyJpZCI6NTAwMS...", // Dùng cái này cho request tiếp theo để load tin cũ hơn

&nbsp;   "prev\_cursor": null

&nbsp; }

}





3.4. Send Message (Gửi tin)



POST /api/client/conversations/{id}/messages



Payload:



{

&nbsp; "uuid": "temp-uuid-generated-by-client", // Client tự sinh UUID để hiện ngay lập tức

&nbsp; "type": "text", // hoặc "image", "file"

&nbsp; "body": "Đã nhận được file nhé",

&nbsp; "attachment\_id": null // Nếu type là file/image thì truyền ID sau khi upload xong

}





3.5. Upload Attachment



POST /api/client/attachments



Payload: FormData chứa file.



Response: Trả về attachment\_id để Client kẹp vào API gửi tin nhắn.



4\. QUY TRÌNH PHÁT TRIỂN \& BẢO MẬT (NOTES)



Middleware:



Tạo middleware CheckClientAccess: Chỉ cho phép Role employee, manager, customer truy cập /api/client.



Tạo middleware CheckAdminAccess: Chỉ cho phép Role admin\_dev, manager truy cập /api/admin.



Policies (Authorization):



ConversationPolicy: Hàm view(User $user, Conversation $conv) phải check xem $user->id có nằm trong bảng pivot conversation\_user của cuộc hội thoại đó không. Nếu không -> 403 Forbidden.



Real-time Logic:



Trong MessageController::store:



Lưu tin nhắn vào DB.



broadcast(new MessageSent($message))->toOthers();



dispatch(new ProcessPushNotification($message)); (Queue job).



Signed URL:



Route /api/client/attachments/{id}/download phải dùng middleware('signed').



Controller dùng Storage::disk('private')->temporaryUrl(...).

