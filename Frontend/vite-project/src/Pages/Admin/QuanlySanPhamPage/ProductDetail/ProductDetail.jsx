import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import ProductService from '../../../../Service/AdminProductSevice/ProductService';
import ProductDetailService from '../../../../Service/AdminProductSevice/ProductDetailService';
import ImageService from '../../../../Service/AdminProductSevice/ImageService';
import ColorService from '../../../../Service/AdminProductSevice/ColorService';
import SizeService from '../../../../Service/AdminProductSevice/SizeService';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productId: parseInt(id),
    imageIds: [],
    sizeId: null,
    colorId: null,
    quantity: 0,
    price: '',
    status: 'AVAILABLE',
  });
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [tempSelectedImages, setTempSelectedImages] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [newImages, setNewImages] = useState([]);

  // Map status enum to Vietnamese
  const statusToVietnamese = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Còn hàng';
      case 'OUT_OF_STOCK':
        return 'Hết hàng';
      case 'DISCONTINUED':
        return 'Ngừng bán';
      default:
        return status;
    }
  };

  // Fetch product by ID
  const fetchProduct = async () => {
    try {
      const data = await ProductService.getById(id);
      if (!data) {
        toast.error('Sản phẩm không tồn tại');
        navigate('/quan-ly-san-pham/danh-sach');
      } else {
        setProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error(error.response?.data?.message || 'Không thể tải thông tin sản phẩm');
    }
  };

  // Fetch product details
  const fetchProductDetails = async () => {
    try {
      const data = await ProductDetailService.getAll(id, page, size);
      setProductDetails(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết sản phẩm');
    }
  };

  // Fetch images, sizes, and colors
  const fetchFormData = async () => {
    try {
      const [imageData, sizeData, colorData] = await Promise.all([
        ImageService.GetAll(),
        SizeService.getAll(0, 100),
        ColorService.getAll(0, 100),
      ]);
      setImages(imageData.data || []);
      setSizes(sizeData.content.map(item => ({ value: item.id, label: item.name })) || []);
      setColors(colorData.content.map(item => ({ value: item.id, label: item.name, code: item.code })) || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu cho form');
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchProductDetails();
    fetchFormData();
  }, [id, page, size]);

  // Handle image selection in modal
  const handleSelectImage = (imageId) => {
    setTempSelectedImages(prev =>
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  };

  // Handle file input for new images
  const handleFileChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  // Handle opening image modal
  const openImageModal = () => {
    setTempSelectedImages([...formData.imageIds]);
    setIsImageModalOpen(true);
  };

  // Handle closing image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  // Handle confirming image selection
  const confirmImageSelection = () => {
    setSelectedImages([...tempSelectedImages]);
    setFormData(prev => ({ ...prev, imageIds: [...tempSelectedImages] }));
    setIsImageModalOpen(false);
  };

  // Handle resetting image selection
  const resetImageSelection = () => {
    setTempSelectedImages([]);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle combobox changes
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : null }));
  };

  // Handle add new product detail
  const handleAdd = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setFormData({
      productId: parseInt(id),
      imageIds: [],
      sizeId: null,
      colorId: null,
      quantity: 0,
      price: '',
      status: 'AVAILABLE',
    });
    setSelectedImages([]);
    setTempSelectedImages([]);
    setNewImages([]);
  };

  // Handle update product detail
  const handleUpdate = async (detail) => {
    try {
      const data = await ProductDetailService.getById(detail.id);
      setIsModalOpen(true);
      setIsEditing(true);
      setEditingId(detail.id);
      const imageIds = data.images ? data.images.map(img => img.id) : [];
      setFormData({
        productId: data.productId,
        imageIds: imageIds,
        sizeId: data.sizeId,
        colorId: data.colorId,
        quantity: data.quantity,
        price: data.price || '',
        status: data.status || 'AVAILABLE',
      });
      setSelectedImages(imageIds);
      setTempSelectedImages(imageIds);
      setNewImages([]);
    } catch (error) {
      console.error('Error fetching product detail:', error);
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết sản phẩm');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast.error('Giá phải là một số hợp lệ');
      return;
    }
    if (formData.imageIds.length === 0 && newImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất một hình ảnh');
      return;
    }
    try {
      let finalImageIds = [...formData.imageIds];
      if (newImages.length > 0) {
        const uploadResponse = await ImageService.Upload(newImages);
        const newImageIds = uploadResponse.data.map(img => img.id);
        finalImageIds = [...finalImageIds, ...newImageIds];
      }

      const payload = {
        productId: formData.productId,
        imageIds: finalImageIds,
        sizeId: formData.sizeId,
        colorId: formData.colorId,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        status: formData.status,
      };

      if (isEditing) {
        await ProductDetailService.update(editingId, payload);
        toast.success('Cập nhật chi tiết sản phẩm thành công!');
      } else {
        await ProductDetailService.create(payload);
        toast.success('Thêm chi tiết sản phẩm thành công!');
      }
      setIsModalOpen(false);
      fetchProductDetails();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu chi tiết sản phẩm');
    }
  };

  // Handle delete product detail
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await ProductDetailService.delete(deleteId);
      toast.success('Xóa chi tiết sản phẩm thành công!');
      setIsDeleteModalOpen(false);
      fetchProductDetails();
    } catch (error) {
      console.error('Error deleting product detail:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa chi tiết sản phẩm');
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Navigate back to ProductAdmin
  const handleBack = () => {
    navigate('/quan-ly-san-pham/danh-sach');
  };

  if (!product) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          <HiOutlineArrowLeft className="mr-2" size={16} />
          Quay lại
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Chi tiết sản phẩm: {product.name}</h2>
      </div>

      {/* Product Information */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin sản phẩm</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mã sản phẩm</p>
            <p className="text-sm font-medium text-gray-800">{product.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tên sản phẩm</p>
            <p className="text-sm font-medium text-gray-800">{product.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Chất liệu</p>
            <p className="text-sm font-medium text-gray-800">{product.materialName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Thương hiệu</p>
            <p className="text-sm font-medium text-gray-800">{product.brandName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Danh mục</p>
            <p className="text-sm font-medium text-gray-800">{product.categoryName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mô tả</p>
            <p className="text-sm font-medium text-gray-800">{product.description || '-'}</p>
          </div>
        </div>
      </div>

      {/* Product Details Management */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quản lý chi tiết sản phẩm</h3>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <HiOutlinePlus className="mr-2" size={16} />
          Thêm mới
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
              <th className="px-6 py-3 w-32">Kích thước</th>
              <th className="px-6 py-3 w-32">Màu sắc</th>
              <th className="px-6 py-3">Hình ảnh</th>
              <th className="px-6 py-3 w-24">Số lượng</th>
              <th className="px-6 py-3 w-32">Giá</th>
              <th className="px-6 py-3 w-32">Trạng thái</th>
              <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {productDetails.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              productDetails.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-indigo-50 transition-colors"
                >
                  <td className="px-6 py-3 text-center">{page * size + index + 1}</td>
                  <td className="px-6 py-3">{item.sizeName}</td>
                  <td className="px-6 py-3 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.colorCode }}
                    />
                    {item.colorName}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {item.images && item.images.map(img => (
                        <img
                          key={img.id}
                          src={`http://localhost:8080${img.url}`}
                          alt={`Image ${img.id}`}
                          className="w-12 h-12 object-cover rounded-md"
                          onError={() => console.error(`Failed to load image: http://localhost:8080${img.url}`)}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3">{item.quantity}</td>
                  <td className="px-6 py-3">{item.price.toLocaleString('vi-VN')} VND</td>
                  <td className="px-6 py-3">{statusToVietnamese(item.status)}</td>
                  <td className="px-6 py-3 text-center flex justify-center gap-2">
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
          <option value={5}>5 / trang</option>
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              {isEditing ? 'Cập nhật chi tiết sản phẩm' : 'Thêm chi tiết sản phẩm mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={openImageModal}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    Chọn ảnh
                  </button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.imageIds.map(imageId => {
                    const image = images.find(img => img.id === imageId);
                    return image ? (
                      <img
                        key={image.id}
                        src={`http://localhost:8080${image.url}`}
                        alt={`Selected image ${image.id}`}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : null;
                  })}
                  {newImages.map((file, index) => (
                    <img
                      key={`new-${index}`}
                      src={URL.createObjectURL(file)}
                      alt={`New image ${index}`}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước</label>
                <Select
                  name="sizeId"
                  value={sizes.find(option => option.value === formData.sizeId) || null}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'sizeId' })}
                  options={sizes}
                  placeholder="Chọn kích thước"
                  isSearchable
                  className="text-sm"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <Select
                  name="colorId"
                  value={colors.find(option => option.value === formData.colorId) || null}
                  onChange={(selectedOption) => handleSelectChange(selectedOption, { name: 'colorId' })}
                  options={colors}
                  placeholder="Chọn màu sắc"
                  isSearchable
                  className="text-sm"
                  getOptionLabel={(option) => (
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: option.code }}
                      />
                      {option.label}
                    </div>
                  )}
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                  min="0"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                >
                  <option value="AVAILABLE">Còn hàng</option>
                  <option value="OUT_OF_STOCK">Hết hàng</option>
                  <option value="DISCONTINUED">Ngừng bán</option>
                </select>
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

      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl shadow-xl overflow-y-auto max-h-[80vh] transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Chọn hình ảnh</h3>
            <div className="grid grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <input
                    type="checkbox"
                    checked={tempSelectedImages.includes(image.id)}
                    onChange={() => handleSelectImage(image.id)}
                    className="absolute top-2 left-2 z-10"
                  />
                  <img
                    src={`http://localhost:8080${image.url}`}
                    alt={`Image ${image.id}`}
                    className="w-full h-48 object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                    onError={() => console.error(`Failed to load image: http://localhost:8080${image.url}`)}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={resetImageSelection}
                className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 focus:outline-none transition-colors"
              >
                Chọn lại
              </button>
              <button
                type="button"
                onClick={closeImageModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmImageSelection}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa chi tiết sản phẩm này không?
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

export default ProductDetail;