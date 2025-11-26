import { signInWithEmailAndPassword, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { auth } from '../firebase'
import { Lock, Mail, ArrowRight, Store } from 'lucide-react' // Nhớ import icon

const Login = () => {
   const [email, setEmail] = useState('')
   const [pass, setPass] = useState('')
   const [error, setError] = useState('')
   const [loading, setLoading] = useState(false)
   const navigate = useNavigate();

   const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try{
        // Ép lưu đăng nhập (F5 không mất)
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth , email, pass)
        navigate("/");
    }
    catch (err) {
        setError("Email hoặc mật khẩu chưa đúng!");
    } finally {
        setLoading(false);
    }
   }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4 relative overflow-hidden'>
        
        {/* Hình nền trang trí (Circle mờ) */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>

        {/* Card Login */}
        <div className='bg-white/95 backdrop-blur-sm p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01] duration-300 border border-white/50'>
            
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <Store size={32} strokeWidth={2.5} />
                </div>
                <h2 className='text-3xl font-extrabold text-gray-800'>Chào mừng trở lại</h2>
                <p className='text-gray-500 text-sm mt-2'>Đăng nhập quản trị viên WeHappi</p>
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
                            className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
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
                            className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                            placeholder="••••••••"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)} 
                            required
                        />
                    </div>
                </div>

                <button 
                    disabled={loading}
                    className='group w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 hover:from-blue-700 hover:to-blue-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2'
                >
                    {loading ? 'Đang xử lý...' : (
                        <>Đăng nhập <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
            </form>
            
            <div className="mt-8 text-center text-xs text-gray-400">
                © 2025 WeHappi System. Designed by Nam.
            </div>
        </div>
    </div>
  )
}

export default Login