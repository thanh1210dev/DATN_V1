import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Banner from "./Banner";
import ProductService from "../../../Service/AdminProductSevice/ProductService";
import CategoryService from "../../../Service/AdminProductSevice/CategoryService";
import ProductFilter from "../ProductPage/ProductFilter";
import ProductCard from "../ProductPage/ProductCard";
import CategorySection from "./CategorySection";



const HomeClient = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    categoryId: "",
    brandId: "",
    materialId: "",
    sizeId: "",
    colorId: "",
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
        toast.error(error, { position: "top-right", autoClose: 3000 });
      }
    };
    fetchData();
  }, [page, size, filters]);

  const handleSearch = () => {
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-white w-full">
      <ToastContainer />
      <Banner />
      <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 w-full">
        {/* Bộ lọc cố định sát trái */}
        <div className="w-full lg:w-1/4">
          <ProductFilter filters={filters} setFilters={setFilters} onSearch={handleSearch} />
        </div>
        {/* Nội dung chính */}
        <div className="w-full lg:w-3/4">
          <CategorySection categories={categories} />
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sản phẩm nổi bật</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.length === 0 ? (
                <p className="col-span-full text-center text-gray-500">Không có sản phẩm</p>
              ) : (
                featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md"
                  disabled={page === 0}
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md"
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
                className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm"
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