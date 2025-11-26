import { Search as SearchIcon, X } from 'lucide-react';

const Search = ({ keyword, onChange, placeholder = "Tìm kiếm..." }) => {
  return (
    // SỬA: Xóa 'mb-6', đổi width để linh hoạt hơn
    <div className="relative w-full md:w-80"> 
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon size={18} className="text-gray-400" />
      </div>
      
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
        placeholder={placeholder}
        value={keyword}
        onChange={(e) => onChange(e.target.value)}
      />

      {keyword && (
        <button 
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Search;