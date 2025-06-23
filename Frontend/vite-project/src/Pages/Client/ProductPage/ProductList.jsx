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
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    categoryId: searchParams.get("categoryId") || "",
    brandId: "",
    materialId: "",
    sizeId: "",
    colorId: "",
    minPrice: 0,
    maxPrice: 10000000,
  });

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
        setProducts(response.content || []);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        toast.error(error, { position: "top-right", autoClose: 3000 });
      }
    };
    fetchProducts();
  }, [page, size, filters]);

  const handleSearch = () => {
    setPage(0);
  };

  return (
    <div className="p-4 sm:p-6 bg-white min-h-screen w-full">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Bộ lọc cố định sát trái */}
        <div className="w-full lg:w-1/4">
          <ProductFilter filters={filters} setFilters={setFilters} onSearch={handleSearch} />
        </div>
        {/* Danh sách sản phẩm */}
        <div className="w-full lg:w-3/4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
};

export default ProductList;