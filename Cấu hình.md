FULL PRODUCTION CONFIGURATION

Domain: hoa.maytinhquocviet.com
Infrastructure: Cloudflare Proxy -> VPS Port 80
Status: Final Version

1. CẤU HÌNH CLOUDFLARE (DASHBOARD)

Vào trang quản trị Cloudflare, đảm bảo cài đặt như sau:

DNS: Record A hoa trỏ về IP VPS. Trạng thái: Proxied (Đám mây cam).

SSL/TLS: Chế độ Flexible (Nếu VPS chưa có SSL) hoặc Full (Nếu VPS có SSL tự ký). Khuyên dùng Flexible cho đơn giản.

Network: Đảm bảo WebSockets đang bật (ON).

2. CẤU HÌNH LARAVEL (.env)

Mở file .env trên Server và cập nhật các dòng sau.

A. Cấu hình App & URL

Tuy server chạy port 80, nhưng người dùng truy cập qua HTTPS của Cloudflare, nên URL phải là https.

APP_NAME="Chat System Enterprise"
APP_ENV=production
APP_DEBUG=false
APP_URL=[https://hoa.maytinhquocviet.com](https://hoa.maytinhquocviet.com)

LOG_CHANNEL=stack
LOG_LEVEL=error


B. Cấu hình Database

DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=chat_prod_db
DB_USERNAME=chat_user
DB_PASSWORD="[YOUR_SECURE_DB_PASSWORD]"


C. Cấu hình Real-time (Reverb)

Đây là phần quan trọng nhất để socket hoạt động qua Cloudflare.

BROADCAST_CONNECTION=reverb

# 1. Config Reverb Server (Chạy ngầm trong VPS)
REVERB_APP_ID=1001
REVERB_APP_KEY="[YOUR_GENERATED_APP_KEY]"
REVERB_APP_SECRET="[YOUR_GENERATED_APP_SECRET]"
REVERB_HOST="hoa.maytinhquocviet.com"
REVERB_PORT=8080
REVERB_SCHEME=http

# 2. Config Client (Người dùng kết nối qua Cloudflare)
# Cloudflare nhận port 443 -> Forward về 80 -> Nginx forward vào 8080
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="hoa.maytinhquocviet.com"
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https


D. Cấu hình Session & Security

# Cho phép giữ đăng nhập trên domain này
SANCTUM_STATEFUL_DOMAINS=hoa.maytinhquocviet.com
SESSION_DOMAIN=.hoa.maytinhquocviet.com

# BẮT BUỘC TRUE: Vì user đang lướt web trên HTTPS
SESSION_SECURE_COOKIE=true


3. CẤU HÌNH CODE LARAVEL (bootstrap/app.php)

Bạn phải báo cho Laravel biết là nó đang đứng sau Cloudflare, nếu không giao diện sẽ bị vỡ (mất CSS/JS).

    ->withMiddleware(function (Middleware $middleware) {
        // Tin tưởng Cloudflare Proxy
        $middleware->trustProxies(at: '*');
        
        $middleware->trustHeaders(
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
                     \Illuminate\Http\Request::HEADER_X_FORWARDED_AWS_ELB
        );
    })


4. CẤU HÌNH NGINX (WEBSERVER)

File: /etc/nginx/sites-available/hoa.maytinhquocviet.com

server {
    listen 80;
    listen [::]:80;
    server_name hoa.maytinhquocviet.com;
    
    root /var/www/chat-app/public;
    index index.php index.html;

    # Cho phép upload file to (50MB)
    client_max_body_size 50M;

    # Lấy IP thật từ Cloudflare (Thay vì IP Proxy)
    set_real_ip_from 0.0.0.0/0;
    real_ip_header CF-Connecting-IP;

    # Xử lý PHP/Laravel
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock; 
        # Hoặc 127.0.0.1:9000 nếu dùng Docker không qua socket
    }

    # --- QUAN TRỌNG: WEBSOCKET PROXY ---
    # Cloudflare gửi request vào cổng 80, Nginx chuyển tiếp vào Reverb (8080)
    location /app {
        proxy_pass [http://127.0.0.1:8080](http://127.0.0.1:8080);
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https; # Giả lập HTTPS cho Reverb hiểu
    }
}


5. CẤU HÌNH FRONTEND JS (resources/js/echo.js)

Cấu hình cho Client biết phải kết nối an toàn (WSS) tới Cloudflare.

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: 'hoa.maytinhquocviet.com',
    
    // Cloudflare nghe ở 443 (HTTPS)
    wsPort: 443,
    wssPort: 443,
    
    // BẮT BUỘC: Client phải dùng bảo mật
    forceTLS: true,
    
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
});


6. QUY TRÌNH KÍCH HOẠT (DEPLOY CHECKLIST)

Sau khi sửa xong các file trên, hãy chạy lần lượt các lệnh sau trên Server:

Cập nhật cấu hình Laravel:

php artisan config:clear
php artisan cache:clear


Khởi động lại Nginx:

sudo nginx -t  # Kiểm tra lỗi cú pháp
sudo service nginx restart


Khởi động lại Reverb (WebSocket Server):

Đảm bảo Supervisor đang chạy lệnh: php artisan reverb:start

Restart nó: sudo supervisorctl restart all

Build lại Frontend (Để nhận config Echo mới):

npm run build


Cách kiểm tra thành công:

Truy cập https://hoa.maytinhquocviet.com.

Đăng nhập vào app.

Bấm F12 -> Tab Network -> Filter chọn WS.

Nếu thấy dòng kết nối bắt đầu bằng wss://hoa.maytinhquocviet.com/app/... và có Status Code 101 Switching Protocols (Màu xanh lá) -> Hệ thống đã chạy hoàn hảo!