import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Eye, X, Package, Truck, CheckCircle, AlertCircle, Calendar, 
  Phone, MapPin, MessageSquare, Filter, ChevronLeft, ChevronRight 
} from 'lucide-react';
import SearchComponent from '../components/Search.jsx'; 

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // --- STATE MỚI CHO BỘ LỌC & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // Lọc trạng thái
  const [currentPage, setCurrentPage] = useState(1);       // Trang hiện tại
  const [itemsPerPage] = useState(5);                      // Số đơn mỗi trang

  // 1. Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setOrders(data);
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // 3. Cập nhật trạng thái
  const handleUpdateStatus = async (orderId, newStatus) => {
    if(!window.confirm(`Xác nhận đổi trạng thái đơn hàng?`)) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus 
      });
      fetchOrders(); 
      setSelectedOrder(null);
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredOrders = orders.filter(order => {
    // 1. Tìm kiếm (Mã đơn hoặc SĐT)
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.id?.toLowerCase().includes(search)) || 
      (order.phone_number?.includes(search));

    // 2. Lọc trạng thái (Nếu status trong DB chưa có thì coi là pending)
    const currentStatus = order.status || 'pending';
    const matchesStatus = statusFilter === 'all' ? true : currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- LOGIC PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- HELPER FUNCTIONS ---
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); 
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  const getStatusBadge = (status) => {
    const currentStatus = status || 'pending';
    switch (currentStatus) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 flex items-center gap-1 w-fit"><AlertCircle size={12}/> Mới</span>;
      case 'shipping': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1 w-fit"><Truck size={12}/> Đang giao</span>;
      case 'completed': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Hoàn thành</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1 w-fit"><X size={12}/> Đã hủy</span>;
      default: return <span>{currentStatus}</span>;
    }
  };

  return (
    <div>
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="text-blue-600"/> Quản lý Đơn hàng
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {orders.length}
            </span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* 1. SEARCH */}
            <SearchComponent 
                keyword={searchTerm} 
                onChange={setSearchTerm} 
                placeholder="Mã đơn, SĐT khách..."
            />

            {/* 2. STATUS FILTER */}
            <div className="relative min-w-\[160px\]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-400" />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    <option value="all">Tất cả đơn</option>
                    <option value="pending">Mới (Chờ duyệt)</option>
                    <option value="shipping">Đang giao</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                <th className="p-4 whitespace-nowrap">Mã đơn</th>
                <th className="p-4 whitespace-nowrap">Khách hàng</th>
                <th className="p-4 whitespace-nowrap">Địa chỉ</th>
                <th className="p-4 whitespace-nowrap">Tổng tiền</th>
                <th className="p-4 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 text-right whitespace-nowrap">Chi tiết</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {/* Render CURRENT ITEMS (Đã phân trang) */}
                {currentItems.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition group">
                    <td className="p-4 font-mono text-xs text-gray-500">
                        #{order.id.slice(0, 6)}...
                        <div className="text-gray-400 mt-1 text-[10px]">{formatDate(order.created_at)}</div>
                    </td>
                    <td className="p-4">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                        <Phone size={14} className="text-blue-500"/> {order.phone_number}
                    </div>
                    {order.note && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 italic">
                            <MessageSquare size={12}/> "{order.note}"
                        </div>
                    )}
                    </td>
                    <td className="p-4 text-gray-600 max-w-[200px] truncate" title={order.address}>
                    <div className="flex items-center gap-1"><MapPin size={14}/> {order.address}</div>
                    </td>
                    <td className="p-4 font-bold text-blue-600 text-base">
                    {formatMoney(order.total_amount)}
                    </td>
                    <td className="p-4">
                    {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4 text-right">
                    <button onClick={() => setSelectedOrder(order)} 
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition font-medium text-xs flex items-center gap-1 ml-auto">
                        <Eye size={16}/> Xem
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* --- PHÂN TRANG (FOOTER) --- */}
        {filteredOrders.length > 0 ? (
            <div className="p-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 mt-auto">
                <span className="text-sm text-gray-500">
                    Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} trong tổng số <b>{filteredOrders.length}</b> đơn hàng
                </span>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
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
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                <Package size={40} className="text-gray-300 mb-2"/>
                <p>Không tìm thấy đơn hàng nào.</p>
            </div>
        )}
      </div>

      {/* MODAL CHI TIẾT (Popup) - Giữ nguyên logic cũ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Chi tiết đơn hàng</h3>
                <p className="text-xs text-gray-500 font-mono">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              
              {/* Thông tin người nhận */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                  <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Thông tin liên hệ</h4>
                  <p className="flex items-center gap-2 mb-1"><Phone size={14}/> <span className="font-semibold">{selectedOrder.phone_number}</span></p>
                  <p className="flex items-start gap-2 text-sm text-gray-700"><MapPin size={14} className="mt-1"/> {selectedOrder.address}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">Ghi chú & Thời gian</h4>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Đặt lúc:</span> {formatDate(selectedOrder.created_at)}
                  </p>
                  {selectedOrder.note && (
                    <p className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2 mt-2">
                      Note: "{selectedOrder.note}"
                    </p>
                  )}
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <h4 className="font-bold text-gray-800 mb-3">Danh sách sản phẩm ({selectedOrder.cart_items?.length})</h4>
              <div className="border rounded-lg overflow-hidden mb-6">
                {selectedOrder.cart_items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border-b last:border-0 hover:bg-gray-50">
                    <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded-md border" />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-gray-900">{item.product_name}</h5>
                        <span className="font-bold text-blue-600">{formatMoney(item.final_price || item.base_price)}</span>
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        {item.options_display && Object.entries(item.options_display).map(([key, value], i) => (
                            <div key={i} className="flex gap-1">
                                <span className="font-semibold capitalize">{key.replace('_', ' ')}:</span> 
                                <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                            </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center font-bold text-gray-700 bg-gray-100 px-3 rounded h-fit">
                      x{item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tổng tiền */}
              <div className="flex justify-end">
                <div className="text-right">
                  <span className="text-gray-500 mr-4">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatMoney(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
              <span className="text-sm text-gray-500 font-medium">Cập nhật trạng thái:</span>
              <div className="flex gap-2">
                 {(!selectedOrder.status || selectedOrder.status === 'pending') && (
                    <>
                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm">Hủy đơn</button>
                        <button onClick={() => handleUpdateStatus(selectedOrder.id, 'shipping')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Giao hàng</button>
                    </>
                 )}
                 {selectedOrder.status === 'shipping' && (
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">Hoàn thành</button>
                 )}
                 {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                     <span className="text-gray-400 italic text-sm px-2 font-medium">Đã đóng đơn hàng</span>
                 )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;