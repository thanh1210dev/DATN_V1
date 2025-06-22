import React, { useState, useEffect } from "react";
import { HiOutlineSearch, HiOutlineFilter } from "react-icons/hi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { toast } from "react-toastify";
import CategoryService from "../../../Service/AdminProductSevice/CategoryService";
import ProductDetailService from "../../../Service/AdminProductSevice/ProductDetailService";
import BrandService from "../../../Service/AdminProductSevice/BranchService";
import MaterialService from "../../../Service/AdminProductSevice/MaterialService";

const ProductFilter = ({ filters, setFilters, onSearch }) => {
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [showCategory, setShowCategory] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, sizesResponse, brandsResponse, materialsResponse] = await Promise.all([
          CategoryService.getAll(0, 100),
          ProductDetailService.getAvailableSizes(0),
          BrandService.getAll(0, 100),
          MaterialService.getAll(0, 100),
        ]);
        setCategories(categoriesResponse.content || []);
        setSizes(sizesResponse);
        setBrands(brandsResponse.content || []);
        setMaterials(materialsResponse.content || []);
      } catch (error) {
        toast.error(error.message, { position: "top-right" });
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (filters.sizeId) {
      const fetchColors = async () => {
        try {
          const colorsResponse = await ProductDetailService.getAvailableColors(0, filters.sizeId);
          setColors(colorsResponse);
        } catch (error) {
          toast.error(error.message, { position: "top-right" });
        }
      };
      fetchColors();
    } else {
      setColors([]);
    }
  }, [filters.sizeId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (filters.minPrice > filters.maxPrice) {
      toast.error("Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa");
      return;
    }
    onSearch();
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-lg sticky top-20 w-full max-w-xs">
      <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
        <HiOutlineFilter size={22} className="text-indigo-600" />
        <span>Bộ lọc sản phẩm</span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-4">
        {/* Tìm kiếm */}
        <div className="relative">
          <input
            type="text"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full"
          />
          <HiOutlineSearch className="absolute left-2 top-2.5 text-indigo-400" size={18} />
        </div>

        {/* Accordion: Phân loại */}
        <div>
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowCategory(!showCategory)}>
            <span className="text-sm font-semibold text-gray-800">Phân loại</span>
            {showCategory ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
          {showCategory && (
            <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.categoryId === category.id}
                    onChange={() => setFilters({ ...filters, categoryId: category.id })}
                    className="accent-indigo-600"
                  />
                  {category.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Accordion: Thương hiệu */}
        <div>
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowBrand(!showBrand)}>
            <span className="text-sm font-semibold text-gray-800">Thương hiệu</span>
            {showBrand ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
          {showBrand && (
            <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="brand"
                    checked={filters.brandId === brand.id}
                    onChange={() => setFilters({ ...filters, brandId: brand.id })}
                    className="accent-indigo-600"
                  />
                  {brand.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Accordion: Chất liệu */}
        <div>
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowMaterial(!showMaterial)}>
            <span className="text-sm font-semibold text-gray-800">Chất liệu</span>
            {showMaterial ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
          {showMaterial && (
            <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
              {materials.map((material) => (
                <label key={material.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="material"
                    checked={filters.materialId === material.id}
                    onChange={() => setFilters({ ...filters, materialId: material.id })}
                    className="accent-indigo-600"
                  />
                  {material.name}
                </label>
              ))}
            </div>
          )}
        </div>

        
        {/* Accordion: Giá */}
        <div>
          <div className="flex justify-between items-center cursor-pointer border-t pt-3" onClick={() => setShowPrice(!showPrice)}>
            <span className="text-sm font-semibold text-gray-800">Giá</span>
            {showPrice ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </div>
          {showPrice && (
            <div className="mt-2 flex flex-col gap-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>{filters.minPrice.toLocaleString("vi-VN")}</span>
                <span>{filters.maxPrice.toLocaleString("vi-VN")}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000000"
                step="100000"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <input
                type="range"
                min="0"
                max="10000000"
                step="100000"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Nút Áp dụng & Xóa */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md"
          >
            Áp dụng
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters({
                code: "",
                name: "",
                categoryId: "",
                brandId: "",
                materialId: "",
                sizeId: "",
                colorId: "",
                minPrice: 0,
                maxPrice: 10000000,
                available: false,
              })
            }
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
          >
            Xóa bộ lọc
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFilter;
