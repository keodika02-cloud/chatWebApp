PROJECT MASTER BLUEPRINT: ENTERPRISE MULTI-TIER CHAT SYSTEM



Version: 4.2 (Standardized with FR/NFR)

Status: Ready for Development



1\. TỔNG QUAN HỆ THỐNG (OVERVIEW)



Hệ thống chat nội bộ doanh nghiệp vận hành theo mô hình Dual-Interface (Hai giao diện), tách biệt rõ ràng giữa quản trị và người dùng cuối, đảm bảo High Availability (Tính sẵn sàng cao) và Bảo mật dữ liệu.



1.1. Mô hình vận hành



Admin Portal (Server Side): Web Dashboard dành cho Admin Dev và Manager để cấu hình, quản lý nhân sự, xem báo cáo, audit log.



Client App (User Side): Ứng dụng (Web \& Mobile) dành cho Employee, Manager và Customer để chat và xử lý công việc.



1.2. Mục tiêu cốt lõi



Đa nền tảng: PC (Web) + Mobile (Android/iOS).



Real-time: Độ trễ dưới 100ms.



Anti-Disconnect: Không mất tin nhắn khi rớt mạng.



Bảo mật: Phân quyền 4 lớp chặt chẽ.



2\. YÊU CẦU HỆ THỐNG CHI TIẾT (SYSTEM REQUIREMENTS)



2.1. Yêu cầu Chức năng (Functional Requirements - FR)



A. Phân hệ Xác thực \& Tài khoản (Auth \& Identity)



Đăng nhập: Hỗ trợ đăng nhập bằng Email/Password hoặc SSO (nếu tích hợp sau này).



Quản lý phiên (Session):



Web: Tự động timeout sau 24h không hoạt động.



Mobile: Duy trì đăng nhập vĩnh viễn (Refresh Token) cho đến khi người dùng Logout hoặc đổi mật khẩu.



Trạng thái hoạt động: Hiển thị Online (chấm xanh), Offline (xám), Vừa truy cập (Online X phút trước).



B. Phân hệ Chat (Core Messaging)



Gửi/Nhận tin: Text, Emoji, Hình ảnh, File đính kèm (PDF, Docx, Zip).



Tương tác tin nhắn:



Reply (Trả lời trích dẫn).



Forward (Chuyển tiếp).



Delete (Xóa phía mình hoặc thu hồi phía mọi người).



Trạng thái tin nhắn: Đã gửi (1 tick), Đã nhận (2 tick xám), Đã xem (2 tick xanh/avatar nhỏ).



Chat Nhóm: Tạo nhóm, Đổi tên nhóm, Đổi ảnh nhóm, Thêm/Xóa thành viên, Rời nhóm.



C. Phân hệ Quản trị (Admin Portal)



Dashboard: Thống kê số lượng user, message trong ngày, dung lượng server.



User Management: Tạo mới nhân viên (cấp tài khoản), Reset mật khẩu, Khóa/Mở khóa tài khoản.



Audit Logs: Tra cứu lịch sử hành động của Manager (Ai đã xóa user nào?).



D. Phân hệ Tìm kiếm \& Tiện ích



Global Search: Tìm kiếm tin nhắn cũ, tên nhân viên, tên nhóm chat (siêu tốc).



Notification: Thông báo đẩy (Push) khi app tắt, thông báo trong app (Badge) khi app mở.



2.2. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)



A. Hiệu năng (Performance)



Độ trễ (Latency): Tin nhắn gửi đi phải xuất hiện ở máy người nhận dưới 100ms (trong điều kiện mạng tốt).



Khả năng chịu tải: Hỗ trợ tối thiểu 1,000 CCU (Concurrent Users) trên một node server tiêu chuẩn (4GB RAM).



Tốc độ tìm kiếm: Kết quả tìm kiếm trả về dưới 200ms.



B. Bảo mật (Security)



Mã hóa đường truyền: 100% kết nối qua HTTPS (TLS 1.2+) và WSS (Secure WebSocket).



Bảo vệ File: Không cho phép truy cập file bằng đường dẫn trực tiếp (Direct Link) mà phải qua cơ chế Signed URL có xác thực.



Sanitize: Chống XSS (khi hiển thị tin nhắn) và SQL Injection.



C. Độ tin cậy (Reliability)



Data Integrity: Không được mất tin nhắn ngay cả khi Server bị restart đột ngột (nhờ Redis AOF và MariaDB ACID).



Offline Capability: App mobile phải cho phép xem lại tin nhắn cũ khi không có mạng.



D. Khả năng tương thích (Compatibility)



Mobile: Android 10+, iOS 15+.



Web: Chrome, Firefox, Safari, Edge (phiên bản mới nhất).



3\. CÔNG NGHỆ CỐT LÕI (TECH STACK)



3.1. Application Stack



Backend: Laravel 11.x (API Mode).



API Authentication: Laravel Sanctum (Token cho Mobile App, SPA Auth cho Web Client).



Frontend Client: Inertia.js + Vue 3 (Composition API) + CapacitorJS (Mobile Build).



Frontend Admin: Livewire hoặc Inertia + Vue 3.



Database: MariaDB 10.6+ (InnoDB Engine).



Search Engine: Laravel Scout + Meilisearch (Tìm kiếm tin nhắn siêu tốc).



Real-time: Laravel Reverb (WebSocket).



Queue/Cache: Redis.



Authorization: spatie/laravel-permission.



3.2. Infrastructure Stack (Docker)



Dev Environment: Laravel Sail (MariaDB, Redis, Reverb, Meilisearch).



Prod Environment: Custom Docker (PHP-FPM Alpine, Nginx, Redis, Reverb, Supervisor, Meilisearch).



4\. CƠ CHẾ PHÂN QUYỀN 4 LỚP (RBAC HIERARCHY)



Level 1: admin\_dev (System Owner)



Phạm vi: Admin Portal.



Quyền: Full quyền hệ thống, xem Log Server, Backup DB, tạo tài khoản Manager.



Bảo vệ: Không thể bị xóa.



Level 2: manager (Quản lý vận hành)



Phạm vi: Admin Portal \& Client App.



Quyền Portal: Quản lý nhân sự (Tạo/Khóa Employee), Xem báo cáo, Audit log chat.



Quyền App: Chat chỉ đạo, Quản lý nhóm chat (Add/Kick thành viên), Duyệt ticket.



Level 3: employee (Nhân viên)



Phạm vi: Client App.



Quyền: Chat nội bộ (với đồng nghiệp), Chat hỗ trợ (với khách hàng được phân công).



Giới hạn: Không xem được dữ liệu người khác.



Level 4: customer (Khách hàng)



Phạm vi: Client App (Portal View).



Quyền: Chỉ gửi/nhận tin trong hội thoại hỗ trợ của chính mình.



5\. CẤU TRÚC DATABASE (COMPLETE SCHEMA)



5.1. Core Users \& Auth



Table: users



id: BigInt (PK).



parent\_id: BigInt (FK).



department\_id: BigInt (FK).



avatar\_url: String.



is\_active: Boolean.



last\_seen\_at: Timestamp.



Table: user\_devices (Push Notification)



id: BigInt.



user\_id: BigInt (FK).



fcm\_token: String.



platform: Enum('android', 'ios', 'web').



last\_active\_at: Timestamp.



5.2. Core Chat System



Table: conversations



id: BigInt.



type: Enum('internal\_direct', 'internal\_group', 'customer\_support').



status: Enum('open', 'resolved', 'pending').



last\_message\_at: Timestamp (Index Sort).



Table: conversation\_user (Pivot)



conversation\_id: FK.



user\_id: FK.



is\_admin: Boolean (Trưởng nhóm).



last\_read\_at: Timestamp.



Table: messages



id: BigInt.



conversation\_id: FK.



user\_id: FK (Nullable nếu là System Message).



type: Enum('text', 'image', 'file', 'system').



body: Text.



uuid: String.



5.3. Enhancements



Table: attachments (Secure Media)



id: BigInt.



message\_id: FK.



user\_id: FK.



file\_path: String (Private Path).



disk: Enum('local', 's3').



Table: activity\_log (Audit)



causer\_id: (Manager ID).



description: Hành động.



properties: JSON.



6\. CÁC HỆ THỐNG LOGIC QUAN TRỌNG



6.1. Chiến lược "Anti-Disconnect" (Client Side)



Heartbeat: Reverb ping 15-30s.



Offline Queue (Pinia): Mất mạng -> Lưu Local Storage -> Có mạng -> Sync API.



6.2. Chiến lược Notification Hybrid



Socket (Reverb): Ưu tiên số 1 khi User Online.



Push (FCM): Ưu tiên số 2 khi User Offline (Check qua Redis Presence).



6.3. Chiến lược System Messages (Tin nhắn hệ thống)



Tự động sinh ra khi Manager/Admin thực hiện hành động nhóm.



VD: Khi Manager thêm User B vào nhóm -> Backend tự tạo bản ghi messages với type='system' và body='Manager đã thêm User B'.



Client hiển thị tin này căn giữa, màu xám nhỏ.



6.4. Chiến lược Tìm kiếm (Search)



Sử dụng Laravel Scout driver Meilisearch.



Index bảng messages và users.



7\. CHIẾN LƯỢC API \& BẢO MẬT



Phân tách API:



/api/admin/\*: Auth bằng Web Cookie/Session.



/api/client/\*: Auth bằng Sanctum Token (Mobile) hoặc Cookie (Web).



Rate Limiting: Chat API 60 req/min, File Upload 10 req/min.



JSON Standard: Laravel API Resources.



Cursor Pagination: Bắt buộc cho messages.



8\. HẠ TẦNG DOCKER (DEPLOYMENT)



8.1. Môi trường Dev (Sail)



Lệnh: php artisan sail:install --with=mariadb,redis,meilisearch



Config: Mở port 8080 (Reverb), 7700 (Meilisearch).



8.2. Môi trường Prod (Custom)



Containers: app, webserver, db, redis, reverb, queue, search.



9\. GỢI Ý CẤU TRÚC FOLDER



app/

├── Http/

│   ├── Controllers/

│   │   ├── Api/

│   │   │   ├── Admin/

│   │   │   └── Client/

│   ├── Middleware/

│   │   ├── CheckAdminAccess.php

│   │   └── CheckClientAccess.php

├── Models/

│   ├── Conversation.php

│   ├── Message.php (Use Searchable Trait)

│   ├── Attachment.php

│   └── UserDevice.php

├── Services/

│   ├── Chat/

│   │   ├── SystemMessageService.php

│   │   └── AttachmentService.php

│   └── Notification/

│       └── FcmService.php



