import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            // QUAN TRỌNG: Phải là app.jsx (khớp với file bạn tạo)
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: '0.0.0.0', // Cho phép truy cập từ ngoài Docker
        hmr: {
            host: 'localhost', // Hot Module Replacement trỏ về localhost
        },
        watch: {
            usePolling: true, // Bắt buộc trên Windows/WSL để nhận diện thay đổi file
        }
    },
});