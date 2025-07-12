import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Banner from './Banner';
import ProductService from '../../../Service/AdminProductSevice/ProductService';
import CategoryService from '../../../Service/AdminProductSevice/CategoryService';
import ProductFilter from '../ProductPage/ProductFilter';
import ProductCard from '../ProductPage/ProductCard';
import CategorySection from './CategorySection';

const HomeClient = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    categoryId: '',
    brandId: '',
    materialId: '',
    sizeId: '',
    colorId: '',
    minPrice: 0,
    maxPrice: 10000000,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          ProductService.getAll(
            page,
            size,
            filters.code || undefined,
            filters.name || undefined,
            filters.materialId || undefined,
            filters.brandId || undefined,
            filters.categoryId || undefined,
            filters.minPrice || undefined,
            filters.maxPrice || undefined
          ),
          CategoryService.getAll(0, 100),
        ]);
        setFeaturedProducts(productsResponse.content || []);
        setTotalPages(productsResponse.totalPages || 1);
        setCategories(categoriesResponse.content || []);
      } catch (error) {
        toast.error(error.message || 'Lỗi khi lấy dữ liệu', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchData();
  }, [page, size, filters]);

  const handleSearch = () => {
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Banner />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/4">
          <ProductFilter filters={filters} setFilters={setFilters} onSearch={handleSearch} />
        </div>
        <div className="w-full lg:w-3/4">
          <CategorySection categories={categories} />
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản Phẩm Nổi Bật</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 text-lg">Không có sản phẩm</p>
              ) : (
                featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-300"
                  disabled={page === 0}
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-300"
                  disabled={page + 1 >= totalPages}
                >
                  Tiếp →
                </button>
              </div>
              <select
                value={size}
                onChange={(e) => {
                  setSize(parseInt(e.target.value));
                  setPage(0);
                }}
                className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={8}>8 / trang</option>
                <option value={16}>16 / trang</option>
                <option value={24}>24 / trang</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeClient;