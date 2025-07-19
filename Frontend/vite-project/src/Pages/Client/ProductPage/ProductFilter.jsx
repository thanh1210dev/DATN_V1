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

  const [showCategory, setShowCategory] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [showMaterial, setShowMaterial] = useState(true);
  const [showSize, setShowSize] = useState(true);
  const [showColor, setShowColor] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  // State cho "Xem thêm"
  const [showMoreCategory, setShowMoreCategory] = useState(false);
  const [showMoreBrand, setShowMoreBrand] = useState(false);
  const [showMoreMaterial, setShowMoreMaterial] = useState(false);
  const [showMoreSize, setShowMoreSize] = useState(false);
  const [showMoreColor, setShowMoreColor] = useState(false);

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

  // Xử lý checkbox cho category
  const handleCategoryChange = (categoryId) => {
    const currentCategories = filters.categoryIds || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    setFilters({ ...filters, categoryIds: newCategories });
  };

  // Xử lý checkbox cho brand
  const handleBrandChange = (brandId) => {
    const currentBrands = filters.brandIds || [];
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter(id => id !== brandId)
      : [...currentBrands, brandId];
    setFilters({ ...filters, brandIds: newBrands });
  };

  // Xử lý checkbox cho material
  const handleMaterialChange = (materialId) => {
    const currentMaterials = filters.materialIds || [];
    const newMaterials = currentMaterials.includes(materialId)
      ? currentMaterials.filter(id => id !== materialId)
      : [...currentMaterials, materialId];
    setFilters({ ...filters, materialIds: newMaterials });
  };

  // Xử lý checkbox cho size
  const handleSizeChange = (sizeId) => {
    const currentSizes = filters.sizeIds || [];
    const newSizes = currentSizes.includes(sizeId)
      ? currentSizes.filter(id => id !== sizeId)
      : [...currentSizes, sizeId];
    setFilters({ ...filters, sizeIds: newSizes });
  };

  // Xử lý checkbox cho color
  const handleColorChange = (colorId) => {
    const currentColors = filters.colorIds || [];
    const newColors = currentColors.includes(colorId)
      ? currentColors.filter(id => id !== colorId)
      : [...currentColors, colorId];
    setFilters({ ...filters, colorIds: newColors });
  };

  // Xử lý checkbox cho price range
  const handlePriceRangeChange = (range) => {
    const currentRanges = filters.priceRanges || [];
    const newRanges = currentRanges.includes(range)
      ? currentRanges.filter(r => r !== range)
      : [...currentRanges, range];
    setFilters({ ...filters, priceRanges: newRanges });
  };

  return (
    <div className="w-full max-w-xs bg-white p-6">
    
      

      {/* Thanh tìm kiếm */}
      <div className="mb-6">
        <input
          type="text"
          value={filters.name}
          onChange={e => setFilters({ ...filters, name: e.target.value })}
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
        />
      </div>

      {/* PHÂN LOẠI */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">PHÂN LOẠI</h3>
        <div className="space-y-2">
          {(categories.length > 0 ? (showMoreCategory ? categories : categories.slice(0, 5)) : []).map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="category"
                checked={(filters.categoryId || '') === category.id}
                onChange={() => setFilters({ ...filters, categoryId: category.id })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              {category.name}
            </label>
          ))}
          {categories.length > 5 && (
            <button
              onClick={() => setShowMoreCategory(!showMoreCategory)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showMoreCategory ? 'Thu gọn' : 'Xem thêm'}
              {showMoreCategory ? <IoIosArrowUp size={14} /> : <IoIosArrowDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* THƯƠNG HIỆU */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">THƯƠNG HIỆU</h3>
        <div className="space-y-2">
          {(brands.length > 0 ? (showMoreBrand ? brands : brands.slice(0, 5)) : []).map((brand) => (
            <label key={brand.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="brand"
                checked={(filters.brandId || '') === brand.id}
                onChange={() => setFilters({ ...filters, brandId: brand.id })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              {brand.name}
            </label>
          ))}
          {brands.length > 5 && (
            <button
              onClick={() => setShowMoreBrand(!showMoreBrand)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showMoreBrand ? 'Thu gọn' : 'Xem thêm'}
              {showMoreBrand ? <IoIosArrowUp size={14} /> : <IoIosArrowDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* CHẤT LIỆU */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">CHẤT LIỆU</h3>
        <div className="space-y-2">
          {(materials.length > 0 ? (showMoreMaterial ? materials : materials.slice(0, 5)) : []).map((material) => (
            <label key={material.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="material"
                checked={(filters.materialId || '') === material.id}
                onChange={() => setFilters({ ...filters, materialId: material.id })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              {material.name}
            </label>
          ))}
          {materials.length > 5 && (
            <button
              onClick={() => setShowMoreMaterial(!showMoreMaterial)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showMoreMaterial ? 'Thu gọn' : 'Xem thêm'}
              {showMoreMaterial ? <IoIosArrowUp size={14} /> : <IoIosArrowDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* GIÁ (giữ nguyên như cũ) */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">MỨC GIÁ</h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            min={0}
            max={filters.maxPrice}
            value={filters.minPrice}
            onChange={e => setFilters({ ...filters, minPrice: Number(e.target.value) })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Từ"
          />
          <span>-</span>
          <input
            type="number"
            min={filters.minPrice}
            max={10000000}
            value={filters.maxPrice}
            onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Đến"
          />
        </div>
        <input
          type="range"
          min={0}
          max={10000000}
          step={100000}
          value={filters.minPrice}
          onChange={e => setFilters({ ...filters, minPrice: Number(e.target.value) })}
          className="w-full accent-indigo-500 mb-1"
        />
        <input
          type="range"
          min={0}
          max={10000000}
          step={100000}
          value={filters.maxPrice}
          onChange={e => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Nút Bỏ lọc */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => setFilters({
            code: "",
            name: "",
            categoryId: "",
            brandId: "",
            materialId: "",
            minPrice: 0,
            maxPrice: 10000000,
          })}
          className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
        >
          Bỏ lọc
        </button>
      </div>
    </div>
  );
};

export default ProductFilter;
