import { LayoutDashboard, LogOut, ShoppingBag, User, Calendar, Menu, X, PieChart,MessageCircleQuestion   } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { auth } from '../firebase.js';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State quản lý đóng/mở menu mobile

    const menu = [
        {title: "Thống kê", icon: PieChart, path: "/"}, // Đổi icon cho hợp lý
        {title: "Sản Phẩm", icon: ShoppingBag, path: "/products"},
        {title: "Đơn hàng", icon: LayoutDashboard, path: "/orders"},
        {title: "Khách hàng", icon: User, path: "/users"},
        {title: "Lịch hẹn", icon: Calendar , path: "/appointments"},
        {title: "Câu hỏi thường gặp", icon: MessageCircleQuestion , path: "/faqs"}, 
    ];

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        auth.signOut();
        navigate("/login");
    };

    // Hàm chuyển trang và tự đóng menu trên mobile
    const handleNavigate = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    return (
        <div className='flex h-screen bg-gray-50 overflow-hidden'>
            
            {/* 1. Màn che màu đen (Chỉ hiện trên mobile khi mở menu) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* 2. SIDEBAR (Có hiệu ứng trượt) */}
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:relative md:translate-x-0
                md:w-64 xl:w-72
            `}>
                {/* Header Sidebar */}
                <div className='p-6 border-b border-gray-100 flex justify-between items-center'>
                    <h1 className='text-xl font-bold text-blue-600'>WeHappi Fashion</h1>
                    {/* Nút đóng menu (chỉ hiện mobile) */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Menu Items */}
                <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
                    {menu.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => handleNavigate(item.path)}
                            className={`
                                flex items-center gap-3 w-full px-4 py-3 rounded-lg transition font-medium
                                ${location.pathname === item.path 
                                ? 'bg-blue-50 text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                }
                            `}
                        >
                            <item.icon size={20} />
                            {item.title}
                        </button>
                    ))}
                </nav>

                {/* Logout */}
                <div className='p-4 border-t border-gray-100'>
                    <button 
                        className='flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium'
                        onClick={handleLogout}
                    >
                        <LogOut size={20}/> Đăng xuất
                    </button>
                </div>   
            </aside>

            {/* 3. MAIN CONTENT */}
            <main className='flex-1 flex flex-col h-screen overflow-hidden'>
                
                {/* Header Mobile (Nút Menu 3 gạch) - Chỉ hiện khi màn hình nhỏ */}
                <div className="md:hidden bg-white border-b p-4 flex items-center gap-4 shadow-sm z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-1 rounded hover:bg-gray-100">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-800 text-lg">Admin Panel</span>
                </div>

                {/* Nội dung chính (Outlet) */}
                <div className='flex-1 overflow-auto p-4 md:p-8 bg-gray-50'>
                    <Outlet/>
                </div>
            </main>
        </div>
    )
}

export default Layout;