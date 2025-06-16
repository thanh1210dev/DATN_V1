import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import ProductService from '../../../../Service/AdminProductSevice/ProductService';

import MaterialService from '../../../../Service/AdminProductSevice/MaterialService';
import BrandService from '../../../../Service/AdminProductSevice/BranchService';
import CategoryService from '../../../../Service/AdminProductSevice/CategoryService';



const ProductAdmin = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    materialId: null,
    brandId: null,
    categoryId: null,
    description: '',
  });
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    materialId: null,
    brandId: null,
    categoryId: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Function to generate random 5-character code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Fetch products with filters 10
  const fetchProducts = async () => {
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
    } catch (error) {
      toast.error(error);
    }
  };

  // Fetch brands, materials, and categories for comboboxes
  const fetchComboboxData = async () => {
    try {
      const brandData = await BrandService.getAll(0, 100);
      setBrands(brandData.content.map(item => ({ value: item.id, label: item.name })));

      const materialData = await MaterialService.getAll(0, 100);
      setMaterials(materialData.content.map(item => ({ value: item.id, label: item.name })));

      const categoryData = await CategoryService.getAll(0, 100);
      setCategories(categoryData.content.map(item => ({ value: item.id, label: item.name })));
    } catch (error) {
      toast.error('Không thể tải dữ liệu cho combobox');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchComboboxData();
  }, [page, size, filters]);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0); // Reset to first page when filters change
  };

  // Handle filter combobox changes
  const handleFilterSelectChange = (selectedOption, { name }) => {
    setFilters((prev) => ({ ...prev, [name]: selectedOption ? selectedOption.value : null }));
    setPage(0); // Reset to first page when filters change
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle combobox changes
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData((prev) => ({ ...prev, [name]: selectedOption ? selectedOption.value : null }));
  };

  // Handle add new product
  const handleAdd = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setFormData({
      code: generateRandomCode(),
      name: '',
      materialId: null,
      brandId: null,
      categoryId: null,
      description: '',
    });
  };

  // Handle update product
  const handleUpdate = (product) => {
    setIsModalOpen(true);
    setIsEditing(true);
    setEditingId(product.id);
    setFormData({
      code: product.code,
      name: product.name,
      materialId: product.materialId,
      brandId: product.brandId,
      categoryId: product.categoryId,
      description: product.description || '',
    });
  };

  // Handle view product details
  const handleViewDetails = (id) => {
    navigate(`/detail-product/${id}`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await ProductService.update(editingId, formData);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await ProductService.create(formData);
        toast.success('Thêm sản phẩm thành công!');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error);
    }
  };

  // Handle delete product
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await ProductService.delete(deleteId);
      toast.success('Xóa sản phẩm thành công!');
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Quản lý sản phẩm</h2>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <HiOutlinePlus className="mr-2" size={16} />
          Thêm mới
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lọc sản phẩm</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm</label>
            <input
              type="text"
              name="code"
              value={filters.code}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập mã sản phẩm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập tên sản phẩm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
            <Select
              name="materialId"
              value={materials.find(option => option.value === filters.materialId) || null}
              onChange={(selectedOption) => handleFilterSelectChange(selectedOption, { name: 'materialId' })}
              options={[{ value: null, label: 'Tất cả' }, ...materials]}
              placeholder="Chọn chất liệu"
              isSearchable
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
            <Select
              name="brandId"
              value={brands.find(option => option.value === filters.brandId) || null}
              onChange={(selectedOption) => handleFilterSelectChange(selectedOption, { name: 'brandId' })}
              options={[{ value: null, label: 'Tất cả' }, ...brands]}
              placeholder="Chọn thương hiệu"
              isSearchable
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <Select
              name="categoryId"
              value={categories.find(option => option.value === filters.categoryId) || null}
              onChange={(selectedOption) => handleFilterSelectChange(selectedOption, { name: 'categoryId' })}
              options={[{ value: null, label: 'Tất cả' }, ...categories]}
              placeholder="Chọn danh mục"
              isSearchable
              className="text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
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
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              products.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-indigo-50 transition-colors"
                >
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
                    >
                      <HiOutlineEye size={16} />
                    </button>
                    <button
                      onClick={() => handleUpdate(item)}
                      className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <HiOutlinePencilAlt size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      title="Xóa"
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

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page + 1 >= totalPages}
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
        >
          
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              {isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 bg-gray-50 transition-colors"
                  disabled={!isEditing}
                  required
                  maxLength={100}
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                  maxLength={100}
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
                <Select
                  name="materialId"
                  value={materials.find(option => option.value === formData.materialId) || null}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'materialId' })}
                  options={materials}
                  placeholder="Chọn chất liệu"
                  isSearchable
                  className="text-sm"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                <Select
                  name="brandId"
                  value={brands.find(option => option.value === formData.brandId) || null}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'brandId' })}
                  options={brands}
                  placeholder="Chọn thương hiệu"
                  isSearchable
                  className="text-sm"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <Select
                  name="categoryId"
                  value={categories.find(option => option.value === formData.categoryId) || null}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'categoryId' })}
                  options={categories}
                  placeholder="Chọn danh mục"
                  isSearchable
                  className="text-sm"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  maxLength={100}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  {isEditing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAdmin;