import axios from 'axios';
window.axios = axios;

// --- 1. AXIOS BASE CONFIG ---
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Include Cookies (Session)
window.axios.defaults.withXSRFToken = true;   // Auto-read XSRF-TOKEN cookie

// --- 2. CSRF TOKEN FALLBACK (Meta Tag) ---
// If the cookie is blocked or missing on first load, use the meta tag
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

/**
 * Load Echo (Realtime)
 */
import './echo';

/**
 * Request Interceptor:
 * 1. Refresh CSRF token if meta tag changes
 * 2. Attach Socket ID for Echo broadcasting
 */
window.axios.interceptors.request.use(config => {
    // Ensure header has the latest meta token value
    const metaToken = document.head.querySelector('meta[name="csrf-token"]');
    if (metaToken && !config.headers['X-CSRF-TOKEN']) {
        config.headers['X-CSRF-TOKEN'] = metaToken.content;
    }

    if (window.Echo && window.Echo.socketId()) {
        config.headers['X-Socket-ID'] = window.Echo.socketId();
    }
    return config;
});