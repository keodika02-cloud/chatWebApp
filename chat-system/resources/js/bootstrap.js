import axios from 'axios';
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Load Echo trước để lấy Socket ID
 */
import './echo';

/**
 * QUAN TRỌNG: Gửi kèm Socket ID trong mọi request
 * Giúp Laravel biết người gửi là ai để dùng hàm ->toOthers()
 */
window.axios.interceptors.request.use(config => {
    if (window.Echo && window.Echo.socketId()) {
        config.headers['X-Socket-ID'] = window.Echo.socketId();
    }
    return config;
});