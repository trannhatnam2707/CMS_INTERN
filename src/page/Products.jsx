import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Plus, Image as ImageIcon, Edit, X, ChevronLeft, ChevronRight, Filter, ShoppingBag } from 'lucide-react'; 
import Search from "../components/Search";

const Products = () => {
  const [products, setProducts] = useState([]);
  
  // --- STATE MỚI CHO BỘ LỌC VÀ PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // Filter danh mục
  const [currentPage, setCurrentPage] = useState(1);            // Trang hiện tại
  const [itemsPerPage] = useState(5);                           // Số lượng sp mỗi trang

  // State Modal & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '', price: '', image: '', description: '', categoryId: '', variantId: ''
  });

  // 1. Lấy dữ liệu
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LOGIC TỰ ĐỘNG LẤY DANH SÁCH DANH MỤC (Unique) ---
  // Quét toàn bộ sản phẩm, lấy ra các categoryId để đưa vào dropdown lọc
  const uniqueCategories = [...new Set(products.flatMap(product => 
    Array.isArray(product.categoryId) ? product.categoryId : []
  ))];

  // --- LOGIC LỌC DỮ LIỆU (SEARCH + CATEGORY) ---
  const filteredProducts = products.filter(item => {
    // 1. Lọc theo tên (Search)
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    // 2. Lọc theo danh mục (Dropdown)
    const matchesCategory = selectedCategory 
        ? (Array.isArray(item.categoryId) && item.categoryId.includes(selectedCategory))
        : true; // Nếu không chọn gì thì lấy hết

    return matchesSearch && matchesCategory;
  });

  // --- LOGIC PHÂN TRANG ---
  // Tính toán sản phẩm cần hiện cho trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Reset về trang 1 khi search hoặc filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Chuyển trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  // ... (Các hàm xử lý Form cũ: handleChange, openModal, handleSubmit, handleDelete giữ nguyên) ...
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  
  const openAddModal = () => {
    setEditMode(false); setEditingId(null);
    setFormData({ name: '', price: '', image: '', description: '', categoryId: '', variantId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditMode(true); setEditingId(product.id);
    setFormData({
      name: product.name, price: product.price, image: product.image || '', description: product.description || '',
      categoryId: Array.isArray(product.categoryId) ? product.categoryId.join(', ') : '',
      variantId: Array.isArray(product.variantId) ? product.variantId.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditMode(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Vui lòng nhập tên và giá!");
    const categoryArray = formData.categoryId.split(',').map(str => str.trim()).filter(item => item);
    const variantArray = formData.variantId.split(',').map(str => str.trim()).filter(item => item);
    const productData = {
      name: formData.name, price: Number(formData.price), image: formData.image,
      description: formData.description, categoryId: categoryArray, variantId: variantArray
    };
    try {
      if (editMode) { await updateDoc(doc(db, "products", editingId), { ...productData, updatedAt: new Date() }); alert("Đã cập nhật!"); } 
      else { await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() }); alert("Đã thêm mới!"); }
      closeModal(); fetchProducts();
    } catch (error) { alert("Lỗi: " + error.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Chắc chắn xóa?')) { try { await deleteDoc(doc(db, "products", id)); fetchProducts(); } catch (error) { alert("Lỗi: " + error.message); } }
  };

  return (
    <div>
      {/* HEADER: Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className='text-blue-600'/> Quản lý Sản phẩm
        </h2>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* 1. Ô SEARCH */}
            <Search 
                keyword={searchTerm} 
                onChange={setSearchTerm} 
                placeholder="Tìm tên sản phẩm..."
            />

            {/* 2. BỘ LỌC DANH MỤC (NEW) */}
            <div className="relative min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter size={18} className="text-gray-400" />
                </div>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                    <option value="">Tất cả danh mục</option>
                    {uniqueCategories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* 3. NÚT THÊM MỚI */}
            <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 whitespace-nowrap">
                <Plus size={20} /> Thêm mới
            </button>
        </div>
      </div>

      {/* --- POPUP MODAL (Giữ nguyên như cũ) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editMode ? <><Edit className="text-blue-600"/> Sửa sản phẩm</> : <><Plus className="text-green-600"/> Thêm sản phẩm mới</>}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* (Form Content giữ nguyên code cũ để tiết kiệm diện tích hiển thị ở đây) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label><input name="name" value={formData.name} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ) *</label><input name="price" type="number" value={formData.price} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh</label><input name="image" value={formData.image} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Category IDs (phẩy)</label><input name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Variant IDs (phẩy)</label><input name="variantId" value={formData.variantId} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-gray-300" /></div>
                </div>
                <div className="flex gap-3 pt-4 border-t mt-4">
                    <button type="button" onClick={closeModal} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100">Hủy</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700">{editMode ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Bảng hiển thị dữ liệu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                <th className="p-4 whitespace-nowrap">Sản phẩm</th>
                <th className="p-4 whitespace-nowrap">Danh mục</th>
                <th className="p-4 whitespace-nowrap">Giá</th>
                <th className="p-4 text-right whitespace-nowrap">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {/* --- SỬA: Render currentItems thay vì filteredProducts --- */}
                {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="p-4">
                        <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={20}/></div>}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{item.name}</div>
                                <div className="text-gray-500 text-xs truncate w-48">{item.description}</div>
                            </div>
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                            {Array.isArray(item.categoryId) ? item.categoryId.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100">{tag}</span>
                            )) : <span className="text-gray-400 text-xs">--</span>}
                        </div>
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openEditModal(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        
        {/* --- PHẦN CHÂN TRANG & PHÂN TRANG (NEW) --- */}
        {filteredProducts.length > 0 ? (
            <div className="p-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                <span className="text-sm text-gray-500">
                    Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)} trong tổng số <b>{filteredProducts.length}</b> sản phẩm
                </span>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    
                    {/* Tạo số trang động */}
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
                <Search size={40} className="text-gray-300 mb-2 mx-auto"/>
                <p>Không tìm thấy sản phẩm nào.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Products;