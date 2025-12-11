import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Trash2, Plus, Image as ImageIcon, Edit, X, ChevronLeft, ChevronRight, ShoppingBag, Filter, Sparkles, Loader2 } from 'lucide-react'; 
import Search from "../components/Search"; 

const Products = () => {
  const [products, setProducts] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(''); // Thêm state lọc danh mục
  const itemsPerPage = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    ProductName: '', Price: '', ImageURL: '', Description: '', MarketingContent: '', Stock: '', CategoryID: ''
  });

  const fetchProducts = async (page = 1) => {
    try {
      const res = await api.get('/api/products/', {
        params: { 
            page, 
            limit: itemsPerPage, 
            search: searchTerm || undefined,
            category_id: selectedCategory || undefined // Gửi category_id nếu có
        }
      });
      setProducts(res.data.data);
      setTotalPages(Math.ceil(res.data.total / itemsPerPage));
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, selectedCategory]); // Refresh khi đổi trang hoặc danh mục

  const handleSearchKeyDown = (e) => {
      if (e.key === 'Enter') {
          setCurrentPage(1);
          fetchProducts(1);
      }
  }

  // --- FORM LOGIC (Giữ nguyên) ---
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  
  const openAddModal = () => {
    setEditMode(false); setEditingId(null);
    setFormData({ ProductName: '', Price: '', ImageURL: '', Description: '', MarketingContent: '', Stock: '', CategoryID: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditMode(true); setEditingId(item.ProductID);
    setFormData({
      ProductName: item.ProductName, Price: item.Price, ImageURL: item.ImageURL || '',
      Description: item.Description || '', MarketingContent: item.MarketingContent || '',
      Stock: item.Stock, CategoryID: item.CategoryID || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditMode(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, Price: Number(formData.Price), Stock: Number(formData.Stock), CategoryID: Number(formData.CategoryID) };
    try {
      if (editMode) { await api.put(`/api/products/${editingId}`, payload); alert("Cập nhật thành công!"); } 
      else { await api.post('/api/products/', payload); alert("Thêm mới thành công!"); }
      closeModal(); fetchProducts(currentPage);
    } catch (error) { alert("Lỗi: " + (error.response?.data?.detail || error.message)); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Chắc chắn xóa?')) { 
        try { await api.delete(`/api/products/${id}`); fetchProducts(currentPage); } 
        catch (error) { alert("Lỗi xóa sản phẩm."); } 
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.ProductName) { alert("Nhập tên trước!"); return; }
    setIsGenerating(true);
    try {
        const res = await api.post('/api/products/generate-marketing-content', { ProductName: formData.ProductName, Description: formData.Description || '' });
        setFormData(prev => ({ ...prev, MarketingContent: res.data.content }));
    } catch (error) { alert("Lỗi AI"); } finally { setIsGenerating(false); }
  };

  return (
    <div className="font-sans">
      {/* 1. TITLE SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className='text-blue-600'/> Quản lý Sản phẩm
            </h2>
            <p className="text-gray-500 text-sm mt-1">Kho hàng và danh mục sản phẩm</p>
        </div>
        
        {/* Nút Thêm Mới được đưa lên góc phải */}
        <button onClick={openAddModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95">
            <Plus size={20} /> Thêm Sản Phẩm
        </button>
      </div>

      {/* 2. TOOLBAR SECTION (Tách biệt) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Left: Search */}
        <div className="w-full md:w-96" onKeyDown={handleSearchKeyDown}>
            <Search 
                keyword={searchTerm} 
                onChange={setSearchTerm} 
                placeholder="Tìm tên sản phẩm..."
            />
        </div>

        {/* Right: Filter Category */}
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="text-gray-500 flex items-center gap-1 text-sm font-medium">
                <Filter size={16}/> Danh mục:
            </div>
            <select 
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white transition-colors cursor-pointer min-w-[150px]"
            >
                <option value="">Tất cả</option>
                {/* Bạn có thể gọi API Categories để map vào đây, tạm thời hardcode demo */}
                <option value="1">Điện thoại</option>
                <option value="2">Laptop</option>
                <option value="3">Đồng hồ</option>
            </select>
        </div>
      </div>

      {/* 3. TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-gray-50 border-b text-gray-600 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                        <th className="p-4">Sản phẩm</th>
                        <th className="p-4 text-center">Danh mục</th>
                        <th className="p-4">Giá bán</th>
                        <th className="p-4 text-center">Kho</th>
                        <th className="p-4 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {products.map((item) => (
                    <tr key={item.ProductID} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4">
                            <div className="flex gap-3 items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                    {item.ImageURL ? <img src={item.ImageURL} className="w-full h-full object-cover" alt="" /> : <ImageIcon size={20} className="m-auto mt-3 text-gray-400"/>}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.ProductName}</div>
                                    <div className="text-gray-400 text-xs truncate max-w-[200px]" title={item.MarketingContent}>
                                        {item.MarketingContent ? <span className='text-purple-600 flex items-center gap-1'><Sparkles size={10}/> {item.MarketingContent}</span> : <span className='italic'>Chưa có nội dung MKT</span>}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="p-4 text-center">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">ID: {item.CategoryID}</span>
                        </td>
                        <td className="p-4 font-bold text-gray-700">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.Price)}
                        </td>
                        <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.Stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.Stock}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(item.ProductID)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"><Trash2 size={18} /></button>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 items-center">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronLeft size={18} /></button>
            <span className="px-4 text-sm font-medium text-gray-600">Trang {currentPage} / {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* --- MODAL FORM (Phần này giữ nguyên logic AI bạn đã có) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold text-gray-800">
                {editMode ? <span className='flex items-center gap-2'><Edit size={20} className='text-blue-600'/> Sửa sản phẩm</span> 
                          : <span className='flex items-center gap-2'><Plus size={20} className='text-green-600'/> Thêm sản phẩm mới</span>}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Các input giữ nguyên như code trước ... */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                    <input name="ProductName" value={formData.ProductName} onChange={handleChange} required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tên SP..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán <span className="text-red-500">*</span></label>
                        <input name="Price" type="number" value={formData.Price} onChange={handleChange} required className="w-full border border-gray-300 p-2.5 rounded-lg" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                        <input name="Stock" type="number" value={formData.Stock} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg" placeholder="0" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục ID</label>
                        <input name="CategoryID" type="number" value={formData.CategoryID} onChange={handleChange} required className="w-full border border-gray-300 p-2.5 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh</label>
                        <input name="ImageURL" value={formData.ImageURL} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg" />
                    </div>
                </div>

                {/* AI Section */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-purple-800 flex items-center gap-1">
                            <Sparkles size={16} /> Nội dung Marketing (AI)
                        </label>
                        <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 flex items-center gap-1 shadow-sm disabled:opacity-50">
                            {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            {isGenerating ? 'Đang viết...' : 'Tự động viết'}
                        </button>
                    </div>
                    <textarea name="MarketingContent" value={formData.MarketingContent} onChange={handleChange} rows="3" className="w-full border border-purple-200 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" placeholder="AI sẽ viết vào đây..." />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                    <textarea name="Description" value={formData.Description} onChange={handleChange} rows="4" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="pt-2 flex gap-3 border-t mt-4">
                    <button type="button" onClick={closeModal} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Hủy</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-bold shadow-md">
                        {editMode ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;