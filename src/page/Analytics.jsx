import { useEffect, useState } from 'react';
import api from '../api/axios'; // Dùng axios thay vì firebase
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Calendar, Award, Package 
} from 'lucide-react';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month'); // Giữ lại state UI để switch active (tạm thời chưa xử lý logic backend cho range)
  
  const [stats, setStats] = useState({
    revenue: 0,
    growth: 0, 
    totalOrders: 0,
    avgOrderValue: 0,
    totalUsers: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]); // Tạm thời để trống hoặc gọi API top product nếu có

  // Helper format tiền
  const formatTooltip = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatYAxis = (tickItem) => {
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}k`;
    return tickItem;
  };

  // --- GỌI API BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/dashboard/stats',{
          params: {time_range: timeRange}
        });
        const data = res.data;

        setStats({
            revenue: data.revenue,
            growth: 10, // Hardcode demo hoặc tính từ BE nếu cần
            totalOrders: data.totalOrders,
            avgOrderValue: data.avgOrderValue,
            totalUsers: data.totalUsers
        });
        
        setChartData(data.chartData); // Dữ liệu biểu đồ từ BE
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
      }
    };
    fetchData();
  }, [timeRange]); // Có thể truyền timeRange xuống BE để lọc theo tuần/tháng

  return (
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 w-full md:w-auto">
          <TrendingUp className="text-blue-600"/> Thống kê chi tiết
        </h2>
        
        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium w-full md:w-auto overflow-x-auto">
          {['day', 'week', 'month'].map((type) => (
            <button 
                key={type}
                onClick={() => setTimeRange(type)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md transition text-center whitespace-nowrap
                    ${timeRange === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {type === 'day' ? 'Hôm nay' : type === 'week' ? 'Tuần này' : 'Tháng này'}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: CÁC THẺ CARD CHỈ SỐ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        
        {/* Card Doanh Thu */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"> <DollarSign size={24} /> </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700`}>
              <TrendingUp size={14}/> +12.5%
            </div>
          </div>
          <p className="text-gray-500 text-sm">Doanh thu</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{formatTooltip(stats.revenue)}</h3>
        </div>

        {/* Card Số đơn hàng */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"> <ShoppingBag size={24} /> </div>
          </div>
          <p className="text-gray-500 text-sm">Đơn hàng</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{stats.totalOrders} <span className="text-base text-gray-400 font-normal">đơn</span></h3>
        </div>

        {/* Card AOV */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 sm:col-span-2 xl:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"> <Award size={24} /> </div>
          </div>
          <p className="text-gray-500 text-sm">Trung bình / đơn</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{formatTooltip(stats.avgOrderValue)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* SECTION 2: BIỂU ĐỒ */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 xl:col-span-2 overflow-hidden">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-gray-400"/> 
              Biểu đồ doanh thu
            </h3>
            <div className="h-[250px] md:h-80 w-full -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11}} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} tick={{fontSize: 11}} width={40} />
                  <Tooltip formatter={(value) => formatTooltip(value)} />
                  <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* SECTION 3: THÔNG TIN KHÁC (Thay thế Top Product tạm thời bằng thông tin user) */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Package className="text-orange-500"/> Tổng quan khác
            </h3>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Tổng khách hàng</span>
                  <span className="font-bold text-blue-600">{stats.totalUsers}</span>
               </div>
               <div className="text-center text-gray-400 py-8 text-sm">
                  Dữ liệu top sản phẩm sẽ cập nhật sau
               </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;