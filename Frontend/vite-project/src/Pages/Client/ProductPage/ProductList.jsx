import React, { useState, useEffect } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSearchParams } from "react-router-dom";
import ProductFilter from "./ProductFilter";
import ProductCard from "./ProductCard";
import ProductService from "../../../Service/AdminProductSevice/ProductService";


const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    categoryId: searchParams.get("categoryId") || "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ProductService.getAll(
          page,
          size,
          filters.code || undefined,
          filters.name || undefined,
          undefined,
          undefined,
          filters.categoryId || undefined
        );
        setProducts(response.content || []);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        toast.error(error, { position: "top-right", autoClose: 3000 });
      }
    };
    fetchProducts();
  }, [page, size, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-8 pr-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
              <HiOutlineSearch className="absolute left-2 top-2.5 text-indigo-400" size={18} />
            </div>
            <ProductFilter filters={filters} setFilters={setFilters} />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Tìm
            </button>
          </form>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">Không có sản phẩm</p>
          ) : (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          )}
        </div>
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={page === 0}
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
  );
};

export default ProductList;