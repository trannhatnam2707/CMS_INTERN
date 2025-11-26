import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Calendar, Clock, MapPin, Phone, User, 
  CheckCircle, XCircle, AlertCircle, Scissors, Trash2, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import SearchComponent from '../components/Search.jsx'; 

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  
  // --- STATE MỚI CHO BỘ LỌC & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Lọc theo trạng thái
  const [currentPage, setCurrentPage] = useState(1);       // Trang hiện tại
  const [itemsPerPage] = useState(5);                      // Số dòng mỗi trang

  // 1. Lấy dữ liệu & Xử lý logic quá hạn
  const fetchAppointments = async () => {
    try {
      const q = query(collection(db, "appointments"), orderBy("appointment_date", "desc"));
      const querySnapshot = await getDocs(q);
      
      const now = new Date();
      const updates = [];

      const data = querySnapshot.docs.map(docItem => {
        const app = { id: docItem.id, ...docItem.data() };
        
        const appTime = app.appointment_time?.toDate ? app.appointment_time.toDate() 
                      : (app.appointment_date?.toDate ? app.appointment_date.toDate() : new Date(app.appointment_date));
        
        // Tự động hủy nếu quá hạn
        if (appTime < now && app.status !== 'completed' && app.status !== 'cancelled') {
            app.status = 'cancelled'; 
            updates.push(updateDoc(doc(db, "appointments", app.id), { status: 'cancelled' }));
        }

        // Nếu chưa có status thì mặc định là pending
        if (!app.status) app.status = 'pending';

        return app;
      });

      if (updates.length > 0) {
          Promise.all(updates).then(() => console.log(`Đã tự động hủy ${updates.length} lịch quá hạn.`));
      }

      setAppointments(data);
    } catch (error) {
      console.error("Lỗi lấy lịch hẹn:", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // 2. Reset về trang 1 khi search hoặc filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // 3. Logic Lọc Dữ Liệu (Search + Status)
  const filteredAppointments = appointments.filter(app => {
    // Lọc tìm kiếm
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      (app.user_name || '').toLowerCase().includes(search) ||
      (app.phone_number || '').includes(search) ||
      (app.product_name || '').toLowerCase().includes(search)
    );

    // Lọc trạng thái
    const matchesStatus = statusFilter === 'all' ? true : app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 4. Logic Phân Trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- CÁC HÀM XỬ LÝ (Update, Delete, Format) GIỮ NGUYÊN ---
  const handleStatusChange = async (id, newStatus) => {
    let message = `Bạn muốn đổi trạng thái thành "${newStatus}"?`;
    if (newStatus === 'confirmed') message = "Xác nhận duyệt lịch hẹn này?";
    if (newStatus === 'completed') message = "Xác nhận khách đã đến làm xong?";
    if (newStatus === 'cancelled') message = "Xác nhận hủy lịch hẹn này?";

    if(!window.confirm(message)) return;

    try {
      await updateDoc(doc(db, "appointments", id), { status: newStatus });
      fetchAppointments();
    } catch (error) {
      alert("Lỗi cập nhật: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Chắc chắn xóa lịch hẹn này vĩnh viễn?")) {
      try {
        await deleteDoc(doc(db, "appointments", id));
        setAppointments(appointments.filter(app => app.id !== id));
      } catch (error) {
        alert("Lỗi xóa: " + error.message);
      }
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200'; 
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'confirmed': return 'Đã duyệt';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ xác nhận'; 
    }
  };

  return (
    <div>
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="text-blue-600" /> Quản lý Lịch hẹn
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {appointments.length}
            </span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* 1. SEARCH */}
            <SearchComponent 
                keyword={searchTerm} 
                onChange={setSearchTerm} 
                placeholder="Tìm tên, SĐT, sản phẩm..."
            />

            {/* 2. FILTER STATUS (Dropdown) */}
            <div className="relative min-w-\[160px\]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-400" />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã duyệt</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                <th className="p-4 whitespace-nowrap">Thông tin khách</th>
                <th className="p-4 whitespace-nowrap">Sản phẩm quan tâm</th>
                <th className="p-4 whitespace-nowrap">Thời gian & Địa điểm</th>
                <th className="p-4 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 text-right whitespace-nowrap">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {/* SỬA: Render currentItems thay vì filteredAppointments */}
                {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition group">
                    
                    {/* 1. Khách hàng */}
                    <td className="p-4 align-top">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                        <User size={16} className="text-gray-400"/> {item.user_name}
                    </div>
                    <div className="text-gray-500 mt-1 flex items-center gap-2">
                        <Phone size={14}/> {item.phone_number}
                    </div>
                    {item.note && (
                        <div className="mt-2 text-xs bg-gray-100 p-2 rounded text-gray-600 italic border-l-2 border-gray-400">
                        "{item.note}"
                        </div>
                    )}
                    </td>

                    {/* 2. Sản phẩm */}
                    <td className="p-4 align-top max-w-[250px]">
                    <div className="flex gap-3">
                        <img src={item.product_image} alt="" className="w-12 h-12 rounded object-cover border bg-gray-50" />
                        <div>
                        <div className="font-medium text-gray-800 line-clamp-2">{item.product_name}</div>
                        <div className="mt-1 space-y-1">
                            {item.selected_options && Object.entries(item.selected_options).map(([key, value], idx) => (
                            <div key={idx} className="text-xs text-gray-500 flex gap-1">
                                <span className="font-semibold capitalize">{key.replace('-', ' ')}:</span>
                                <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    </div>
                    </td>

                    {/* 3. Thời gian */}
                    <td className="p-4 align-top">
                    <div className="flex items-center gap-2 font-bold text-blue-600 mb-1">
                        <Calendar size={14}/> {formatDate(item.appointment_date)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-xs mb-2">
                        <Clock size={14}/> {formatTime(item.appointment_time || item.appointment_date)}
                    </div>
                    <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                        <div className="font-semibold flex items-center gap-1 text-gray-700">
                            <MapPin size={12}/> {item.store_name}
                        </div>
                        <div className="truncate max-w-[200px]" title={item.store_address}>
                            {item.store_address}
                        </div>
                    </div>
                    </td>

                    {/* 4. Trạng thái */}
                    <td className="p-4 align-top">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit ${getStatusColor(item.status)}`}>
                        {item.status === 'pending' && <AlertCircle size={12}/>}
                        {item.status === 'confirmed' && <Scissors size={12}/>} 
                        {item.status === 'completed' && <CheckCircle size={12}/>}
                        {item.status === 'cancelled' && <XCircle size={12}/>}
                        <span className="uppercase">{getStatusLabel(item.status || 'pending')}</span>
                    </span>
                    </td>

                    {/* 5. Hành động */}
                    <td className="p-4 align-top text-right">
                    <div className="flex flex-col gap-2 items-end">
                        
                        {(item.status === 'pending' || !item.status) && (
                        <button onClick={() => handleStatusChange(item.id, 'confirmed')} 
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition shadow-sm">
                            Duyệt lịch
                        </button>
                        )}
                        
                        {item.status === 'confirmed' && (
                        <button onClick={() => handleStatusChange(item.id, 'completed')} 
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition shadow-sm">
                            Hoàn thành
                        </button>
                        )}

                        {item.status !== 'completed' && item.status !== 'cancelled' && (
                            <button onClick={() => handleStatusChange(item.id, 'cancelled')} 
                            className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition border border-transparent hover:border-red-100">
                            Hủy hẹn
                            </button>
                        )}

                        <button onClick={() => handleDelete(item.id)} 
                            className="text-gray-400 hover:text-red-600 p-1 rounded transition" title="Xóa vĩnh viễn">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </td>

                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* --- THANH PHÂN TRANG (NEW) --- */}
        {filteredAppointments.length > 0 ? (
            <div className="p-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 mt-auto">
                <span className="text-sm text-gray-500">
                    Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAppointments.length)} trong tổng số <b>{filteredAppointments.length}</b> lịch hẹn
                </span>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        ) : (
            <div className="p-10 text-center text-gray-500">
                <Calendar size={40} className="text-gray-300 mb-2 mx-auto"/>
                <p>Không tìm thấy lịch hẹn nào.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;