import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Eye, Package, Truck, CheckCircle, AlertCircle, X, Filter, ChevronLeft, ChevronRight, Search, DollarSign } from 'lucide-react';
import SearchComponent from '../components/Search.jsx'; 

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchOrders = async (page = 1) => {
    try {
      const res = await api.get('/api/orders/', {
        params: { 
            page, 
            limit: itemsPerPage, 
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: searchTerm || undefined
        }
      });
      setOrders(res.data.data);
      setTotalPages(Math.ceil(res.data.total / itemsPerPage));
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, statusFilter]); 

  const handleSearchKeyDown = (e) => {
      if (e.key === 'Enter') {
          setCurrentPage(1);
          fetchOrders(1);
      }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    let confirmMsg = "";
    if (newStatus === 'Paid') confirmMsg = "Xác nhận đã nhận được tiền từ khách?";
    else if (newStatus === 'Shipping') confirmMsg = "Xác nhận bắt đầu giao hàng?";
    else if (newStatus === 'Completed') confirmMsg = "Xác nhận đơn hàng đã giao thành công?";
    else if (newStatus === 'Cancelled') confirmMsg = "Chắc chắn muốn hủy đơn hàng này?";

    if(!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/api/orders/${orderId}/${newStatus}`);
      fetchOrders(currentPage);
      setSelectedOrder(null);
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // 👇 SỬA LẠI HÀM FORMAT DATE (Fix lỗi lệch múi giờ)
  const formatDate = (dateString) => {
      if (!dateString) return '';
      // Thêm 'Z' vào cuối nếu chưa có để trình duyệt hiểu đây là giờ UTC
      // Khi đó nó sẽ tự cộng thêm 7 tiếng (giờ VN) -> Hiển thị đúng
      const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 flex items-center gap-1 w-fit"><AlertCircle size={12}/> Chờ thanh toán</span>;
      case 'Paid': return <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold border border-teal-200 flex items-center gap-1 w-fit"><DollarSign size={12}/> Đã thanh toán</span>;
      case 'Shipping': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1 w-fit"><Truck size={12}/> Đang giao</span>;
      case 'Completed': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Hoàn thành</span>;
      case 'Cancelled': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1 w-fit"><X size={12}/> Đã hủy</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="font-sans pb-10">
      {/* 1. TITLE */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600"/> Quản lý Đơn hàng
        </h2>
        <p className="text-gray-500 text-sm mt-1">Theo dõi và cập nhật trạng thái đơn hàng theo quy trình</p>
      </div>
      
      {/* 2. TOOLBAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-96" onKeyDown={handleSearchKeyDown}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Tìm Mã đơn hoặc Tên khách..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="text-gray-500 flex items-center gap-1 text-sm font-medium whitespace-nowrap">
                <Filter size={16}/> Lọc theo:
            </div>
            <select 
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white transition-colors cursor-pointer min-w-[180px]"
            >
                <option value="all">Tất cả đơn</option>
                <option value="Pending">Chờ thanh toán (Pending)</option>
                <option value="Paid">Đã thanh toán (Paid)</option>
                <option value="Shipping">Đang giao (Shipping)</option>
                <option value="Completed">Hoàn thành (Completed)</option>
                <option value="Cancelled">Đã hủy (Cancelled)</option>
            </select>
        </div>
      </div>

      {/* 3. TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase text-xs">
                <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Ngày đặt</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                <tr key={order.OrderID} className="hover:bg-gray-50 transition group">
                    <td className="p-4 font-mono text-xs text-gray-500 font-bold">#{order.OrderID}</td>
                    <td className="p-4 text-gray-700">{formatDate(order.OrderDate)}</td>
                    
                    {/* 👇 HIỂN THỊ TÊN KHÁCH HÀNG THAY VÌ ID */}
                    <td className="p-4 text-gray-700 font-medium">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{order.UserName}</span>
                            <span className="text-xs text-gray-400">ID: {order.UserID}</span>
                        </div>
                    </td>

                    <td className="p-4 font-bold text-blue-600 text-base">
                        {formatMoney(order.TotalAmount)}
                    </td>
                    <td className="p-4">{getStatusBadge(order.Status)}</td>
                    <td className="p-4 text-right">
                        <button onClick={() => setSelectedOrder(order)} 
                            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition ml-auto flex items-center gap-1 font-medium text-xs">
                            <Eye size={16}/> Chi tiết
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 transition"><ChevronLeft size={18} /></button>
            <span className="py-2 px-4 text-sm font-medium bg-white border rounded-lg shadow-sm">Trang {currentPage} / {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 transition"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* 4. MODAL CHI TIẾT */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Chi tiết đơn hàng #{selectedOrder.OrderID}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6 text-sm p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                        <p className="text-gray-500 mb-1">Khách hàng</p>
                        <p className="font-bold text-gray-800 text-lg">{selectedOrder.UserName}</p>
                        <p className="text-xs text-gray-400">ID: {selectedOrder.UserID}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Ngày đặt</p>
                        <p className="font-semibold">{formatDate(selectedOrder.OrderDate)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Tổng tiền</p>
                        <p className="font-bold text-red-600 text-xl">{formatMoney(selectedOrder.TotalAmount)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 mb-1">Trạng thái hiện tại</p>
                        <div>{getStatusBadge(selectedOrder.Status)}</div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h4 className="font-bold mb-3 text-gray-700">Cập nhật trạng thái:</h4>
                    <div className="flex gap-3 flex-wrap">
                        {selectedOrder.Status === 'Pending' && (
                            <>
                                <button onClick={() => handleUpdateStatus(selectedOrder.OrderID, 'Paid')} className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md font-medium transition flex items-center gap-2">💰 Đã nhận tiền (Paid)</button>
                                <button onClick={() => handleUpdateStatus(selectedOrder.OrderID, 'Cancelled')} className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition">❌ Hủy đơn</button>
                            </>
                        )}
                        {selectedOrder.Status === 'Paid' && (
                            <button onClick={() => handleUpdateStatus(selectedOrder.OrderID, 'Shipping')} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium transition flex items-center gap-2">🚚 Giao hàng (Shipping)</button>
                        )}
                        {selectedOrder.Status === 'Shipping' && (
                            <button onClick={() => handleUpdateStatus(selectedOrder.OrderID, 'Completed')} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md font-medium transition flex items-center gap-2">✅ Hoàn tất (Completed)</button>
                        )}
                        {(selectedOrder.Status === 'Completed' || selectedOrder.Status === 'Cancelled') && (
                            <span className="text-gray-400 italic px-4 py-2 bg-gray-100 rounded-lg w-full text-center border border-gray-200">Đơn hàng đã đóng, không thể thao tác thêm.</span>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;