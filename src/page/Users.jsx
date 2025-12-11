import { useEffect, useState } from 'react';
import api from '../api/axios'; // Dùng axios
import { MapPin, Search, User, Phone, Trash2, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import SearchComponent from '../components/Search.jsx';

const Users = () => {
  const [users, setUsers] = useState([]);
  
  // --- STATE TÌM KIẾM & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8; // Backend limit

  // 1. Gọi API lấy danh sách User
  const fetchUsers = async (page = 1) => {
    try {
      const res = await api.get('/api/users/users', {
        params: {
            page: page,
            limit: itemsPerPage,
            search: searchTerm || undefined
        }
      });
      // Map response: { data: [...], total: ... }
      setUsers(res.data.data);
      setTotalPages(Math.ceil(res.data.total / itemsPerPage));
    } catch (error) {
      console.log("Lỗi lấy danh sách users", error)
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]); // Gọi lại khi đổi trang

  // Xử lý khi nhấn Enter tìm kiếm
  const handleSearchKeyDown = (e) => {
      if (e.key === 'Enter') {
          setCurrentPage(1);
          fetchUsers(1);
      }
  }

  // 3. Xử lý xóa user (Cần thận trọng)
  const handleDelete = async (id, name) => {
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa khách hàng "${name}"? \nHành động này sẽ xóa cả lịch sử mua hàng của họ!`)) return;
    try {
      await api.delete(`/api/users/users/${id}`);
      alert("Đã xóa thành công!");
      fetchUsers(currentPage); // Load lại trang
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  // UI GIAO DIỆN CŨ (Giữ nguyên class Tailwind)
  return (
    <div className="font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600" /> Quản lý Khách hàng
          </h2>
          <p className="text-gray-500 text-sm mt-1">Danh sách tài khoản khách hàng</p>
        </div>

        <div className="w-full md:w-80" onKeyDown={handleSearchKeyDown}>
            <SearchComponent
            keyword={searchTerm}
            onChange={setSearchTerm}
            placeholder="Tên, Email hoặc SĐT..."
            />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full'>
        <div className="overflow-x-auto">
          <table className='w-full text-left text-sm min-w-[800px]'>
            <thead className='bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase text-xs'>
              <tr>
                <th className='p-4 whitespace-nowrap'>Khách hàng</th>
                <th className='p-4 whitespace-nowrap'>Liên hệ</th>
                <th className='p-4 whitespace-nowrap'>Địa chỉ</th>
                <th className='p-4 text-right whitespace-nowrap'>Hành động</th>
              </tr>
            </thead>

            <tbody className='divide-y divide-gray-100'>
              {users.map((user) => (
                <tr key={user.UserID} className='hover:bg-gray-50 transition group'>
                  
                  <td className='p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0'>
                        {user.FullName ? user.FullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className='font-bold text-gray-900'>{user.FullName || "Chưa đặt tên"}</div>
                        <div className='text-xs text-gray-400 font-mono'>ID: {user.UserID}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className='p-4'>
                    <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-gray-600'>
                            <Mail size={14} className='text-blue-400' />
                            {user.Email}
                        </div>
                        {user.PhoneNumber && (
                            <div className='flex items-center gap-2 text-gray-600'>
                                <Phone size={14} className='text-green-500' />
                                {user.PhoneNumber}
                            </div>
                        )}
                    </div>
                  </td>
                  
                  <td className='p-4 text-gray-600 max-w-[200px] truncate' title={user.Address}>
                    <div className='flex items-center gap-2'>
                      {user.Address ? (
                          <><MapPin size={16} className='text-red-400 shrink-0' /> {user.Address}</>
                      ) : (
                          <span className='italic text-gray-400 text-xs'>Chưa cập nhật</span>
                      )}
                    </div>
                  </td>
                  
                  <td className='p-4 text-right'>
                    <button className='text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition'
                      onClick={() => handleDelete(user.UserID, user.FullName)}
                      title='Xóa khách hàng'
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 items-center">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="p-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 transition"
            >
                <ChevronLeft size={18} />
            </button>
            <span className="px-4 text-sm font-medium text-gray-600">
                Trang {currentPage} / {totalPages || 1}
            </span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 transition"
            >
                <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  )
}

export default Users;