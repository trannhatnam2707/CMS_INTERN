import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Store } from 'lucide-react';
import api from '../api/axios'; // Import axios vừa tạo

const Login = () => {
   const [email, setEmail] = useState('');
   const [pass, setPass] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();

   const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        // Gửi Form Data theo chuẩn OAuth2 của FastAPI
        const formData = new FormData();
        formData.append('username', email); // FastAPI yêu cầu field là 'username'
        formData.append('password', pass);

        const res = await api.post('/api/users/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Lưu Token
        if (res.data.access_token) {
            localStorage.setItem('access_token', res.data.access_token);
            // Lưu thông tin user nếu có
            if (res.data.user) {
                localStorage.setItem('user_info', JSON.stringify(res.data.user));
                
                // Kiểm tra quyền Admin
                if (res.data.user.role === 'admin') {
                    navigate("/"); // Vào Dashboard
                } else {
                    setError("Tài khoản này không có quyền Admin!");
                    localStorage.clear();
                }
            } else {
                 navigate("/"); // Fallback nếu API không trả user object
            }
        }
    } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || "Email hoặc mật khẩu không đúng!");
    } finally {
        setLoading(false);
    }
   }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4 relative overflow-hidden font-sans'>
        {/* Giữ nguyên phần giao diện (UI) cũ của bạn */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>

        <div className='bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01] duration-300 border border-white/50'>
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Store size={32} strokeWidth={2.5} />
                </div>
                <h2 className='text-3xl font-extrabold text-gray-800'>Admin Portal</h2>
                <p className='text-gray-500 text-sm mt-2'>Đăng nhập hệ thống quản lý</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                    <div className='bg-red-50 border-l-4 border-red-500 text-red-600 text-sm p-3 rounded animate-pulse'>
                        {error}
                    </div>
                )}

                <div className="space-y-1">
                    <label className='block text-sm font-medium text-gray-700 ml-1'>Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input 
                            type='email' 
                            className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all'
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className='block text-sm font-medium text-gray-700 ml-1'>Mật khẩu</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Lock size={18} />
                        </div>
                        <input 
                            type='password' 
                            className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all'
                            placeholder="••••••••"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)} 
                            required
                        />
                    </div>
                </div>

                <button 
                    disabled={loading}
                    className='group w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2'
                >
                    {loading ? 'Đang xử lý...' : <>Đăng nhập <ArrowRight size={20} /></>}
                </button>
            </form>
        </div>
    </div>
  )
}

export default Login;