import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, 
  Calendar, Award, Package 
} from 'lucide-react';

const Analytics = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [timeRange, setTimeRange] = useState('month'); // day | week | month

  const [stats, setStats] = useState({
    revenue: 0,
    growth: 0, 
    totalOrders: 0,
    avgOrderValue: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // --- HELPER: Xử lý tiền tệ an toàn ---
  const parseMoney = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val.replace(/,/g, '')) || 0;
    return 0;
  };

  const formatYAxis = (tickItem) => {
    if (!tickItem) return '0';
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}k`;
    return tickItem;
  };

  const formatTooltip = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  // --- 1. LẤY DỮ LIỆU ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => {
          const data = doc.data();
          // Xử lý Date an toàn: Nếu không có created_at thì lấy ngày hiện tại để không lỗi
          const dateObj = data.created_at?.toDate ? data.created_at.toDate() : new Date();
          return {
            id: doc.id,
            ...data,
            date: dateObj
          };
        });
        setAllOrders(orders);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  // --- 2. TÍNH TOÁN LOGIC (Đã sửa lại logic ngày tháng) ---
  useEffect(() => {
    if (allOrders.length === 0) return;

    const now = new Date();
    let currentOrders = [];
    let previousOrders = [];
    let chartMap = {}; 

    // === LOGIC LỌC THỜI GIAN (FIXED) ===
    if (timeRange === 'day') {
      // HÔM NAY
      const startOfToday = new Date(now);
      startOfToday.setHours(0,0,0,0);
      
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      
      currentOrders = allOrders.filter(o => o.date >= startOfToday);
      previousOrders = allOrders.filter(o => o.date >= startOfYesterday && o.date < startOfToday);

      // Chart: 0h -> 23h
      for(let i=0; i<24; i++) chartMap[`${i}h`] = 0;
      currentOrders.forEach(o => {
        const hour = o.date.getHours() + 'h';
        chartMap[hour] = (chartMap[hour] || 0) + parseMoney(o.total_amount);
      });

    } else if (timeRange === 'week') {
      // TUẦN NÀY (Tính từ Thứ 2)
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay(); // 0 (CN) -> 6 (T7)
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh về Thứ 2
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0,0,0,0);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      currentOrders = allOrders.filter(o => o.date >= startOfWeek);
      previousOrders = allOrders.filter(o => o.date >= startOfLastWeek && o.date < startOfWeek);

      // Chart: T2 -> CN
      const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      days.forEach(d => chartMap[d] = 0);
      
      currentOrders.forEach(o => {
        let dayIndex = o.date.getDay(); // 0 là CN, 1 là T2
        if (dayIndex === 0) dayIndex = 7; // Đổi CN thành 7 để dễ map
        const label = dayIndex === 7 ? 'CN' : `T${dayIndex + 1}`;
        chartMap[label] = (chartMap[label] || 0) + parseMoney(o.total_amount);
      });

    } else {
      // THÁNG NÀY
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      currentOrders = allOrders.filter(o => o.date >= startOfMonth);
      previousOrders = allOrders.filter(o => o.date >= startOfLastMonth && o.date < startOfMonth);

      // Chart: Ngày 1 -> Cuối tháng
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for(let i=1; i<=daysInMonth; i++) chartMap[i] = 0;

      currentOrders.forEach(o => {
        const day = o.date.getDate();
        chartMap[day] = (chartMap[day] || 0) + parseMoney(o.total_amount);
      });
    }

    // --- TÍNH TỔNG ---
    const currentRevenue = currentOrders.reduce((sum, o) => sum + parseMoney(o.total_amount), 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + parseMoney(o.total_amount), 0);

    let growthRate = 0;
    if (previousRevenue === 0) {
      growthRate = currentRevenue > 0 ? 100 : 0;
    } else {
      growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    }

    // --- TOP SẢN PHẨM ---
    const productMap = {};
    currentOrders.forEach(order => {
      if (order.cart_items && Array.isArray(order.cart_items)) {
        order.cart_items.forEach(item => {
          const name = item.product_name;
          if (!productMap[name]) productMap[name] = { name, quantity: 0, revenue: 0, image: item.product_image };
          
          const qty = Number(item.quantity) || 1;
          const price = Number(item.final_price || item.base_price) || 0;
          
          productMap[name].quantity += qty;
          productMap[name].revenue += price * qty;
        });
      }
    });
    const sortedProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // --- CẬP NHẬT STATE ---
    setStats({
      revenue: currentRevenue,
      growth: growthRate,
      totalOrders: currentOrders.length,
      avgOrderValue: currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0
    });

    setTopProducts(sortedProducts);
    setChartData(Object.keys(chartMap).map(key => ({ name: key, value: chartMap[key] })));

  }, [allOrders, timeRange]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
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
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${stats.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {stats.growth >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
              {Math.abs(stats.growth).toFixed(1)}%
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

        {/* SECTION 3: TOP SẢN PHẨM */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Package className="text-orange-500"/> Top bán chạy
            </h3>
            
            <div className="space-y-4">
              {topProducts.map((prod, index) => (
                <div key={index} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                      {index + 1}
                  </div>
                  
                  <img src={prod.image} className="w-10 h-10 rounded object-cover bg-gray-100 border shrink-0" alt="" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={prod.name}>{prod.name}</p>
                    <p className="text-xs text-gray-500">Đã bán: {prod.quantity}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
                      {formatTooltip(prod.revenue)}
                    </span>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">Chưa có số liệu</div>}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;