import React, { useState, useEffect } from 'react';
import { HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { useNavigate, useParams } from 'react-router-dom';
import DotGiamGiaApi from '../../../Service/AdminDotGiamGiaSevice/DotGiamGiaApi';
import ProductService from '../../../Service/AdminProductSevice/ProductService';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import BrandService from '../../../Service/AdminProductSevice/BranchService';
import MaterialService from '../../../Service/AdminProductSevice/MaterialService';
import CategoryService from '../../../Service/AdminProductSevice/CategoryService';

const DotGiamGiaDetailAdmin = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    materialId: null,
    brandId: null,
    categoryId: null,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState([]);
  const [promotion, setPromotion] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailPage, setDetailPage] = useState(0);
  const [detailSize, setDetailSize] = useState(5);
  const [detailTotalPages, setDetailTotalPages] = useState(1);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [promotionPage, setPromotionPage] = useState(0);
  const [promotionSize, setPromotionSize] = useState(10);
  const [promotionTotalPages, setPromotionTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Hàm hiển thị lỗi chi tiết
  const showError = (error) => {
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err) => toast.error(err));
    } else {
      toast.error(error.message || 'Đã xảy ra lỗi không xác định');
    }
  };

  // Fetch promotion details by ID
  const fetchPromotion = async () => {
    setIsLoading(true);
    try {
      const response = await DotGiamGiaApi.getById(id);
      setPromotion(response.data);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products with filters
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await ProductService.getAll(
        page,
        size,
        filters.code || null,
        filters.name || null,
        filters.materialId || null,
        filters.brandId || null,
        filters.categoryId || null
      );
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setSelectedProducts([]);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product details by product ID with pagination
  const fetchProductDetails = async (productId) => {
    setIsLoading(true);
    try {
      const response = await ProductDetailService.getAll(productId, detailPage, detailSize);
      setProductDetails(response.content || []);
      setDetailTotalPages(response.totalPages || 1);
      setCurrentProductId(productId);
      setIsDetailModalOpen(true);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch promotion products with pagination
  const fetchPromotionProducts = async () => {
    setIsLoading(true);
    try {
      const response = await DotGiamGiaApi.getPromotionProducts(id, promotionPage, promotionSize);
      setPromotionProducts(response.data.content || []);
      setPromotionTotalPages(response.data.totalPages || 1);
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch brands, materials, and categories for comboboxes
  const fetchComboboxData = async () => {
    setIsLoading(true);
    try {
      const brandData = await BrandService.getAll(0, 100);
      setBrands(brandData.content.map(item => ({ value: item.id, label: item.name })));

      const materialData = await MaterialService.getAll(0, 100);
      setMaterials(materialData.content.map(item => ({ value: item.id, label: item.name })));

      const categoryData = await CategoryService.getAll(0, 100);
      setCategories(categoryData.content.map(item => ({ value: item.id, label: item.name })));
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotion();
    fetchProducts();
    fetchComboboxData();
    fetchPromotionProducts();
  }, [page, size, filters, id, promotionPage, promotionSize]);

  useEffect(() => {
    if (isDetailModalOpen && currentProductId) {
      fetchProductDetails(currentProductId);
    }
  }, [detailPage, detailSize, currentProductId]);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleFilterSelectChange = (selectedOption, { name }) => {
    setFilters((prev) => ({ ...prev, [name]: selectedOption ? selectedOption.value : null }));
    setPage(0);
  };

  const handleViewDetails = (id) => {
    setDetailPage(0);
    setSelectedProductDetails([]);
    fetchProductDetails(id);
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await ProductService.delete(deleteId);
      toast.success('Xóa sản phẩm thành công!');
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single product selection
  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
    );
  };

  // Handle select all products
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  // Handle single product detail selection
  const handleSelectProductDetail = (detailId) => {
    setSelectedProductDetails((prev) =>
      prev.includes(detailId) ? prev.filter((id) => id !== detailId) : [...prev, detailId]
    );
  };

  // Handle select all product details
  const handleSelectAllDetails = () => {
    if (selectedProductDetails.length === productDetails.length) {
      setSelectedProductDetails([]);
    } else {
      setSelectedProductDetails(productDetails.map((detail) => detail.id));
    }
  };

  // Handle assign action
  const handleAssign = async () => {
    if (selectedProducts.length === 0 && selectedProductDetails.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một sản phẩm hoặc chi tiết sản phẩm để Gắn Vào Đợt');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn gán khuyến mãi này không?')) return;

    setIsLoading(true);
    try {
      // Gán khuyến mãi cho nhiều sản phẩm
      if (selectedProducts.length > 0) {
        const assignRequest = {
          promotionId: parseInt(id),
          productIds: selectedProducts,
          productDetailIds: [],
        };
        await DotGiamGiaApi.assignToMultiple(assignRequest);
        toast.success('Gán khuyến mãi cho sản phẩm thành công!');
      }

      // Gán khuyến mãi cho chi tiết sản phẩm
      if (selectedProductDetails.length > 0) {
        const assignSingleRequests = selectedProductDetails.map((detailId) => ({
          promotionId: parseInt(id),
          productDetailId: detailId,
        }));
        await Promise.all(
          assignSingleRequests.map((request) => DotGiamGiaApi.assignToSingle(request))
        );
        toast.success('Gán khuyến mãi cho chi tiết sản phẩm thành công!');
      }

      setSelectedProducts([]);
      setSelectedProductDetails([]);
      setIsDetailModalOpen(false);
      fetchPromotionProducts(); // Tải lại danh sách sản phẩm đã gán
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString('vi-VN') : '-';
  };

  // Format typePromotion
  const formatTypePromotion = (type) => {
    return type === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định';
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Promotion Details */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Thông tin đợt giảm giá</h2>
        {promotion ? (
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Mã đợt giảm giá</p>
                <p className="text-base text-gray-900 font-semibold">{promotion.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tên đợt giảm giá</p>
                <p className="text-base text-gray-900 font-semibold">{promotion.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Loại giảm giá</p>
                <p className="text-base text-gray-900 font-semibold">{formatTypePromotion(promotion.typePromotion)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Thời gian bắt đầu</p>
                <p className="text-base text-gray-900">{formatDate(promotion.startTime)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Thời gian kết thúc</p>
                <p className="text-base text-gray-900">{formatDate(promotion.endTime)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Phần trăm giảm giá</p>
                <p className="text-base text-gray-900">{promotion.percentageDiscountValue ? `${promotion.percentageDiscountValue}%` : '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Giá trị giảm tối đa</p>
                <p className="text-base text-gray-900">{promotion.maxDiscountValue ? `${promotion.maxDiscountValue.toLocaleString('vi-VN')} VND` : '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Trạng thái</p>
                <p className="text-base text-gray-900">{promotion.status}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-gray-600">Mô tả</p>
                <p className="text-base text-gray-900">{promotion.description || '-'}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-base text-gray-500">Đang tải thông tin đợt giảm giá...</p>
        )}
      </div>

      {/* Promotion Products */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Sản phẩm đã gán khuyến mãi</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs font-semibold uppercase bg-indigo-100 text-indigo-800">
              <tr>
                <th className="px-6 py-3 w-16">#</th>
                <th className="px-6 py-3">Mã sản phẩm</th>
                <th className="px-6 py-3">Tên sản phẩm</th>
                <th className="px-6 py-3">Giá gốc</th>
                <th className="px-6 py-3">Giá sau khuyến mãi</th>
                <th className="px-6 py-3">Trạng thái sản phẩm</th>
                <th className="px-6 py-3">Trạng thái khuyến mãi</th>
              </tr>
            </thead>
            <tbody>
              {promotionProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500 text-sm">
                    Chưa có sản phẩm nào được gán
                  </td>
                </tr>
              ) : (
                promotionProducts.map((item, index) => (
                  <tr key={item.productDetailId} className="border-b hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-3 text-center">{promotionPage * promotionSize + index + 1}</td>
                    <td className="px-6 py-3">{item.productCode}</td>
                    <td className="px-6 py-3">{item.productName}</td>
                    <td className="px-6 py-3">{item.price.toLocaleString('vi-VN')} VND</td>
                    <td className="px-6 py-3">{item.priceAfterPromotion.toLocaleString('vi-VN')} VND</td>
                    <td className="px-6 py-3">{item.productStatus}</td>
                    <td className="px-6 py-3">{item.promotionStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination for Promotion Products */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPromotionPage((prev) => Math.max(prev - 1, 0))}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={promotionPage === 0 || isLoading}
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
              Trang {promotionPage + 1} / {promotionTotalPages}
            </span>
            <button
              onClick={() => setPromotionPage((prev) => Math.min(prev + 1, promotionTotalPages - 1))}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={promotionPage + 1 >= promotionTotalPages || isLoading}
            >
              Tiếp →
            </button>
          </div>
          <select
            className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={promotionSize}
            onChange={(e) => {
              setPromotionSize(parseInt(e.target.value));
              setPromotionPage(0);
            }}
            disabled={isLoading}
          >
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Danh sách sản phẩm</h2>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              disabled={isLoading}
            >
              {selectedProducts.length === products.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
            <button
              onClick={handleAssign}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}
            >
              Gắn Vào Đợt
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lọc sản phẩm</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mã sản phẩm</label>
              <input
                type="text"
                name="code"
                value={filters.code}
                onChange={handleFilterChange}
                className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Nhập mã sản phẩm"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tên sản phẩm</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Nhập tên sản phẩm"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Chất liệu</label>
              <Select
                name="materialId"
                value={materials.find(option => option.value === filters.materialId) || null}
                onChange={(selectedOption) => handleFilterSelectChange(selectedOption, { name: 'materialId' })}
                options={[{ value: null, label: 'Tất cả' }, ...materials]}
                placeholder="Chọn chất liệu"
                isSearchable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Thương hiệu</label>
              <Select
                name="brandId"
                value={brands.find(option => option.value === filters.brandId) || null}
                onChange={(selectedOption) => handleFilterSelectChange(selectedOption, { name: 'brandId' })}
                options={[{ value: null, label: 'Tất cả' }, ...brands]}
                placeholder="Chọn thương hiệu"
                isSearchable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Danh mục</label>
              <Select
                name="categoryId"
                value={categories.find(option => option.value === filters.categoryId) || null}
                onChange={(selectedOption) => handleFilterSelectChange(selectedOption, { name: 'categoryId' })}
                options={[{ value: null, label: 'Tất cả' }, ...categories]}
                placeholder="Chọn danh mục"
                isSearchable
                className="text-sm"
                isDisabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs font-semibold uppercase bg-indigo-100 text-indigo-800">
              <tr>
                <th className="px-6 py-3 w-16 rounded-tl-lg">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                </th>
                <th className="px-6 py-3 w-16">#</th>
                <th className="px-6 py-3 w-32">Mã</th>
                <th className="px-6 py-3">Tên</th>
                <th className="px-6 py-3 w-32">Chất liệu</th>
                <th className="px-6 py-3 w-32">Thương hiệu</th>
                <th className="px-6 py-3 w-32">Danh mục</th>
                <th className="px-6 py-3">Mô tả</th>
                <th className="px-6 py-3 w-36 rounded-tr-lg">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500 text-sm">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                products.map((item, index) => (
                  <tr key={item.id} className="border-b hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(item.id)}
                        onChange={() => handleSelectProduct(item.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                    </td>
                    <td className="px-6 py-3 text-center">{page * size + index + 1}</td>
                    <td className="px-6 py-3">{item.code}</td>
                    <td className="px-6 py-3">{item.name}</td>
                    <td className="px-6 py-3">{item.materialName}</td>
                    <td className="px-6 py-3">{item.brandName}</td>
                    <td className="px-6 py-3">{item.categoryName}</td>
                    <td className="px-6 py-3">{item.description || '-'}</td>
                    <td className="px-6 py-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetails(item.id)}
                        className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        title="Xem chi tiết"
                        disabled={isLoading}
                      >
                        <HiOutlineEye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(item.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        title="Xóa"
                        disabled={isLoading}
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination for Products */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === 0 || isLoading}
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page + 1 >= totalPages || isLoading}
            >
              Tiếp →
            </button>
          </div>
          <select
            className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value));
              setPage(0);
            }}
            disabled={isLoading}
          >
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa sản phẩm này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isLoading}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Chi tiết sản phẩm</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setProductDetails([]);
                  setSelectedProductDetails([]);
                  setCurrentProductId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span></span>
              <button
                onClick={handleSelectAllDetails}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                disabled={isLoading}
              >
                {selectedProductDetails.length === productDetails.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs font-semibold uppercase bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 w-16">
                      <input
                        type="checkbox"
                        checked={productDetails.length > 0 && selectedProductDetails.length === productDetails.length}
                        onChange={handleSelectAllDetails}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                    </th>
                    <th className="px-6 py-3 w-16">#</th>
                    <th className="px-6 py-3">Mã sản phẩm</th>
                    <th className="px-6 py-3">Tên sản phẩm</th>
                    <th className="px-6 py-3">Kích thước</th>
                    <th className="px-6 py-3">Màu sắc</th>
                    <th className="px-6 py-3">Số lượng</th>
                    <th className="px-6 py-3">Giá</th>
                    <th className="px-6 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center text-gray-500 text-sm">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    productDetails.map((detail, detailIndex) => (
                      <tr key={detail.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductDetails.includes(detail.id)}
                            onChange={() => handleSelectProductDetail(detail.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-6 py-3 text-center">{detailPage * detailSize + detailIndex + 1}</td>
                        <td className="px-6 py-3">{detail.productCode}</td>
                        <td className="px-6 py-3">{detail.productName}</td>
                        <td className="px-6 py-3">{detail.sizeName}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full inline-block"
                              style={{ backgroundColor: detail.colorCode }}
                            ></span>
                            {detail.colorName}
                          </div>
                        </td>
                        <td className="px-6 py-3">{detail.quantity}</td>
                        <td className="px-6 py-3">{detail.price.toLocaleString('vi-VN')} VND</td>
                        <td className="px-6 py-3">{detail.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailPage((prev) => Math.max(prev - 1, 0))}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={detailPage === 0 || isLoading}
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
                  Trang {detailPage + 1} / {detailTotalPages}
                </span>
                <button
                  onClick={() => setDetailPage((prev) => Math.min(prev + 1, detailTotalPages - 1))}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={detailPage + 1 >= detailTotalPages || isLoading}
                >
                  Tiếp →
                </button>
              </div>
              <select
                className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={detailSize}
                onChange={(e) => {
                  setDetailSize(parseInt(e.target.value));
                  setDetailPage(0);
                }}
                disabled={isLoading}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setProductDetails([]);
                  setSelectedProductDetails([]);
                  setCurrentProductId(null);
                }}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Đóng
              </button>
              <button
                onClick={handleAssign}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Gắn Vào Đợt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DotGiamGiaDetailAdmin;
