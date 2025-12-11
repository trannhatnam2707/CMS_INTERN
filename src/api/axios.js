import axios from 'axios';

// Cấu hình URL cơ sở (Base URL) của Backend FastAPI
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // Đổi port nếu BE của bạn chạy port khác
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động gắn Token vào mỗi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: Xử lý lỗi trả về (Ví dụ: 401 Unauthorized -> Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Hết hạn token hoặc không có quyền -> Xóa token và về login
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;