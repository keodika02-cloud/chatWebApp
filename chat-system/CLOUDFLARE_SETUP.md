# Hướng dẫn Cấu hình Cloudflare Tunnel cho Laravel Reverb

Để tính năng Chat Realtime (WebSocket) hoạt động trên domain `hoa.maytinhquocviet.com`, bạn cần cấu hình Cloudflare Tunnel để định tuyến riêng traffic WebSocket vào đúng port 8080.

## Cách 1: Nếu dùng file cấu hình (config.yml)
Hãy tìm file `config.yml` của cloudflared và sửa phần `ingress` như sau:

```yaml
tunnel: <Tunnel-UUID>
credentials-file: /root/.cloudflared/<Tunnel-UUID>.json

ingress:
  # 1. Định tuyến việc bắt tay WebSocket vào Reverb (Port 8080)
  - hostname: hoa.maytinhquocviet.com
    path: /app*
    service: http://localhost:8080

  # 2. Các traffic còn lại vào Web Server (Port 80)
  - hostname: hoa.maytinhquocviet.com
    service: http://localhost:80

  # 3. Mặc định 404
  - service: http_status:404
```

Sau đó restart lại tunnel:
`docker restart cloudflared` (hoặc lệnh tương ứng bạn dùng).

---

## Cách 2: Nếu dùng Cloudflare Dashboard (Zero Trust)
1. Vào **Zero Trust** > **Access** > **Tunnels**.
2. Chọn Tunnel của bạn -> **Configure**.
3. Tab **Public Hostname**, nhấn **Add a public hostname**.
4. Thêm rule cho WebSocket:
   - **Subdomain**: `hoa` (hoặc để trống nếu dùng root domain)
   - **Domain**: `maytinhquocviet.com`
   - **Path**: `/app*` (Quan trọng: phải có /app*)
   - **Service**: `HTTP` -> `localhost:8080`
5. Đảm bảo rule này nằm **TRÊN** rule mặc định (rule không có path).

---

## Kiểm tra
Sau khi cấu hình xong, truy cập lại web. Bạn sẽ thấy dòng log trong Console F12:
`Mode: Realtime (Reverb)` và không còn lỗi đỏ `WebSocket connection failed`.
