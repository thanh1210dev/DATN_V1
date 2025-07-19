import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSearchParams } from "react-router-dom";
import ProductService from "../../../Service/AdminProductSevice/ProductService";
import ProductFilter from "./ProductFilter";
import ProductCard from "./ProductCard";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("newest"); // newest, name-asc, name-desc, price-asc, price-desc
  const [filters, setFilters] = useState({
    code: "",
    name: searchParams.get("name") || "",
    categoryId: searchParams.get("categoryId") || "",
    brandId: "",
    materialId: "",
    minPrice: 0,
    maxPrice: 10000000,
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      name: searchParams.get("name") || "",
      categoryId: searchParams.get("categoryId") || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ProductService.getAll(
          page,
          size,
          filters.code || undefined,
          filters.name || undefined,
          filters.materialId || undefined,
          filters.brandId || undefined,
          filters.categoryId || undefined,
          filters.minPrice || undefined,
          filters.maxPrice || undefined
        );
        
        let filteredProducts = response.content || [];
        
        // Sắp xếp sản phẩm
        switch (sortBy) {
          case "name-asc":
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "name-desc":
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case "price-asc":
            filteredProducts.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
            break;
          case "price-desc":
            filteredProducts.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
            break;
          case "newest":
          default:
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        }
        
        setProducts(filteredProducts);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        toast.error(error, { position: "top-right", autoClose: 3000 });
      }
    };
    fetchProducts();
  }, [page, size, filters, sortBy]);

  const handleSearch = () => {
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Bộ lọc bên trái */}
          <div className="w-80 flex-shrink-0">
            <ProductFilter filters={filters} setFilters={setFilters} onSearch={handleSearch} />
          </div>
          
          {/* Danh sách sản phẩm bên phải */}
          <div className="flex-1">
            {/* Dropdown sắp xếp */}
            <div className="flex justify-end mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="newest">Sản phẩm mới</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="name-desc">Tên Z-A</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                </select>
              </div>
            </div>

            {/* Lưới sản phẩm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 py-8">Không có sản phẩm</p>
              ) : (
                products.map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>

            {/* Phân trang kiểu cũ */}
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
                <option value={12}>12 / trang</option>
                <option value={24}>24 / trang</option>
                <option value={36}>36 / trang</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;