import { deleteDoc, getDocs, collection, doc } from 'firebase/firestore';
import { MapPin, Search, User, Phone, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'; // Thêm icon phân trang
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import SearchComponent from '../components/Search.jsx';

const Users = () => {
  const [users, setUsers] = useState([]);
  
  // --- STATE MỚI: TÌM KIẾM & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);       // Trang hiện tại
  const [itemsPerPage] = useState(5);                      // Số dòng mỗi trang

  // 1. Lấy data từ collection customers
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(data);
    } catch (error) {
      console.log("Lỗi lấy danh sách users", error)
    }
  };

  useEffect(() => {
    fetchUsers()
  }, []);

  // 2. Reset về trang 1 khi tìm kiếm thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 3. Xử lý xóa user
  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa users có ID: ${id} này không? `)) return;
    try {
      await deleteDoc(doc(db, "customers", id));
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  // 4. Logic Lọc dữ liệu
  const filterUsers = users.filter(user => {
    const name = (user.user_name || '').toLowerCase();
    const phone = (user.phone_number || '');
    const search = searchTerm.toLowerCase();
    return name.includes(search) || phone.includes(search);
  });

  // 5. Logic Phân trang (Cắt danh sách)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filterUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filterUsers.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600" /> Quản lý Khách hàng
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Tổng số: <span className="font-bold text-blue-600">{users.length}</span> khách hàng
          </p>
        </div>

        <SearchComponent
          keyword={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tên, Số điện thoại..."
        />
      </div>

      {/* TABLE CONTAINER */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full'>
        <div className="overflow-x-auto">
          <table className='w-full text-left text-sm min-w-[800px]'>
            <thead className='bg-gray-50 text-gray-600 font-semibold border-b border-gray-200'>
              <tr>
                <th className='p-4 whitespace-nowrap'>Khách hàng</th>
                <th className='p-4 whitespace-nowrap'>Liên hệ</th>
                <th className='p-4 whitespace-nowrap'>Địa chỉ</th>
                <th className='p-4 text-right whitespace-nowrap'>Hành động</th>
              </tr>
            </thead>

            <tbody className='divide-y divide-gray-100'>
              {/* SỬA: Dùng currentItems thay vì filterUsers */}
              {currentItems.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50 transition group'>
                  
                  <td className='p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0'>
                        {user.user_name ? user.user_name.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <div className='font-bold text-gray-900'>{user.user_name || "Chưa đặt tên"}</div>
                        <div className='text-xs text-gray-400 font-mono'>ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className='p-4'>
                    <div className='flex items-center gap-2 text-gray-700 font-medium bg-gray-50 px-3 py-1 rounded-full w-fit'>
                      <Phone size={14} className=' text-blue-500' />
                      {user.phone_number || "Không có số điện thoại"}
                    </div>
                  </td>
                  
                  <td className='p-4 text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <MapPin size={16} className='text-red-400' />
                      {user.address || <span className='italic text-gray-400'>Chưa cập nhật</span>}
                    </div>
                  </td>
                  
                  <td className='p-4 text-right'>
                    <button className='text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition'
                      onClick={() => handleDelete(user.id)}
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

        {/* --- THANH PHÂN TRANG (FOOTER) --- */}
        {filterUsers.length > 0 ? (
            <div className="p-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 mt-auto">
                <span className="text-sm text-gray-500">
                    Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filterUsers.length)} trong tổng số <b>{filterUsers.length}</b> kết quả
                </span>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
                    {/* Số trang */}
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => paginate(i + 1)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition
                                ${currentPage === i + 1 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}
                            `}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        ) : (
          <div className='p-10 text-center text-gray-500 flex flex-col items-center'>
            <Search size={40} className='text-gray-300 mb-2' />
            <p>Không tìm thấy khách hàng nào khớp với "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Users;