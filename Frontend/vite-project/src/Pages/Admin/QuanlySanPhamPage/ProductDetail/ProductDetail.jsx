import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineArrowLeft, HiChevronLeft, HiChevronRight, HiOutlineQrcode } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import QRCode from 'qrcode';
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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImageViewModalOpen, setIsImageViewModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedImagesForView, setSelectedImagesForView] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    productId: parseInt(id),
    imageIds: [],
    sizeIds: [],
    colorIds: [],
    code: '',
    quantity: 0,
    price: '',
    status: 'AVAILABLE',
  });
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [tempSelectedImages, setTempSelectedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  // Hàm tạo và tải mã QR
  const generateAndDownloadQRCode = async (code) => {
    try {
      const qrCodeUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `QR_${code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Tải mã QR cho sản phẩm ${code} thành công!`);
    } catch (error) {
      toast.error('Không thể tạo mã QR: ' + error.message);
    }
  };

  // Các hàm khác giữ nguyên như mã gốc
  const statusToVietnamese = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Còn hàng</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Hết hàng</span>;
      case 'DISCONTINUED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Ngừng bán</span>;
      default:
        return <span className="text-gray-500">-</span>;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const fetchProduct = async () => {
    try {
      if (!id || isNaN(parseInt(id))) {
        toast.error('ID sản phẩm không hợp lệ');
        navigate('/admin/quan-ly-san-pham/danh-sach');
        return;
      }
      const data = await ProductService.getById(parseInt(id));
      if (!data) {
        toast.error('Sản phẩm không tồn tại');
        navigate('/admin/quan-ly-san-pham/danh-sach');
      } else {
        setProduct(data);
      }
    } catch (error) {
      toast.error(error.message || 'Không thể tải sản phẩm');
    }
  };

  const fetchProductDetails = async () => {
    try {
      const data = await ProductDetailService.getAll(parseInt(id), page, size);
      setProductDetails(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error(error.message || 'Không thể tải chi tiết sản phẩm');
    }
  };

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
      toast.error('Không thể tải dữ liệu cho form');
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchProductDetails();
    fetchFormData();
  }, [id, page, size]);

  const handleSelectImage = (imageId) => {
    setTempSelectedImages(prev =>
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  };

  const handleFileChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  const openImageModal = () => {
    setTempSelectedImages([...formData.imageIds]);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const confirmImageSelection = () => {
    setSelectedImages([...tempSelectedImages]);
    setFormData(prev => ({ ...prev, imageIds: [...tempSelectedImages] }));
    setIsImageModalOpen(false);
  };

  const resetImageSelection = () => {
    setTempSelectedImages([]);
  };

  const openImageViewModal = (images) => {
    setSelectedImagesForView(images);
    setCurrentImageIndex(0);
    setIsImageViewModalOpen(true);
  };

  const closeImageViewModal = () => {
    setIsImageViewModalOpen(false);
    setSelectedImagesForView([]);
    setCurrentImageIndex(0);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? selectedImagesForView.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev === selectedImagesForView.length - 1 ? 0 : prev + 1));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOptions, { name }) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOptions ? selectedOptions.map(option => option.value) : [],
    }));
  };

  const handleAdd = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setFormData({
      productId: parseInt(id),
      imageIds: [],
      sizeIds: [],
      colorIds: [],
      code: '',
      quantity: 0,
      price: '',
      status: 'AVAILABLE',
    });
    setSelectedImages([]);
    setTempSelectedImages([]);
    setNewImages([]);
  };

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
        sizeIds: [data.sizeId],
        colorIds: [data.colorId],
        code: data.code,
        quantity: data.quantity,
        price: data.price || '',
        status: data.status || 'AVAILABLE',
      });
      setSelectedImages(imageIds);
      setTempSelectedImages(imageIds);
      setNewImages([]);
    } catch (error) {
      toast.error(error.message || 'Không thể tải chi tiết sản phẩm');
    }
  };

  const validateForm = () => {
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast.error('Giá phải là một số hợp lệ');
      return false;
    }
    if (formData.imageIds.length === 0 && newImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất một hình ảnh');
      return false;
    }
    if (formData.sizeIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một kích thước');
      return false;
    }
    if (formData.colorIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một màu sắc');
      return false;
    }
    if (isEditing && !formData.status) {
      toast.error('Vui lòng chọn trạng thái');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const payload = {
      productId: formData.productId,
      imageIds: [...formData.imageIds],
      sizeIds: isEditing ? [formData.sizeIds[0]] : formData.sizeIds,
      colorIds: isEditing ? [formData.colorIds[0]] : formData.colorIds,
      code: isEditing ? formData.code : generateRandomCode(),
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
      status: isEditing ? formData.status : 'AVAILABLE',
    };

    if (newImages.length > 0) {
      payload.newImages = newImages;
    }

    setPendingPayload(payload);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      let finalImageIds = [...pendingPayload.imageIds];
      if (pendingPayload.newImages && pendingPayload.newImages.length > 0) {
        const uploadResponse = await ImageService.Upload(pendingPayload.newImages);
        const newImageIds = uploadResponse.data.map(img => img.id);
        finalImageIds = [...finalImageIds, ...newImageIds];
      }

      const finalPayload = {
        ...pendingGeneratedAndDownloadQRCode,
        imageIds: finalImageIds,
        newImages: undefined,
      };

      if (isEditing) {
        await ProductDetailService.update(editingId, finalPayload);
        toast.success('Cập nhật chi tiết sản phẩm thành công!');
      } else {
        await ProductDetailService.create(finalPayload);
        toast.success('Thêm chi tiết sản phẩm thành công!');
      }
      setIsModalOpen(false);
      setIsConfirmModalOpen(false);
      setPendingPayload(null);
      fetchProductDetails();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
      setIsConfirmModalOpen(false);
      setPendingPayload(null);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
    setPendingPayload(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      await ProductDetailService.delete(deleteId);
      toast.success('Xóa chi tiết sản phẩm thành công!');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      fetchProductDetails();
    } catch (error) {
      toast.error(error.message || 'Không thể xóa chi tiết sản phẩm');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsImageModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsConfirmModalOpen(false);
    setIsImageViewModalOpen(false);
    setDeleteId(null);
    setPendingPayload(null);
    setSelectedImagesForView([]);
    setCurrentImageIndex(0);
  };

  const handleBack = () => {
    navigate('/admin/quan-ly-san-pham/danh-sach');
  };

  if (!product) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-6">
      <style>
        {`
          .image-carousel {
            position: relative;
            overflow: hidden;
            width: 48px;
            height: 48px;
            cursor: pointer;
          }
          .image-carousel-inner {
            display: flex;
            position: absolute;
            top: 0;
            left: 0;
          }
          .image-carousel img {
            width: 48px;
            height: 48px;
            object-fit: cover;
            border-radius: 6px;
            flex-shrink: 0;
          }
        `}
      </style>
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
          <div>
            <p className="text-sm text-gray-600">Giá thấp nhất</p>
            <p className="text-sm font-medium text-gray-800">{product.minPrice ? product.minPrice.toLocaleString('vi-VN') + ' VND' : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Giá cao nhất</p>
            <p className="text-sm font-medium text-gray-800">{product.maxPrice ? product.maxPrice.toLocaleString('vi-VN') + ' VND' : '-'}</p>
          </div>
        </div>
      </div>

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

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
              <th className="px-6 py-3 w-32">Mã sản phẩm</th>
              <th className="px-6 py-3">Tên sản phẩm</th>
              <th className="px-6 py-3 w-32">Kích thước</th>
              <th className="px-6 py-3 w-32">Màu sắc</th>
              <th className="px-6 py-3 w-32">Hình ảnh</th>
              <th className="px-6 py-3 w-24">Số lượng</th>
              <th className="px-6 py-3 w-32">Giá</th>
              <th className="px-6 py-3 w-32">Giá khuyến mãi</th>
              <th className="px-6 py-3 w-32">Trạng thái</th>
              <th className="px-6 py-3 w-40">Ngày tạo</th>
              <th className="px-6 py-3 w-48 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {productDetails.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-6 py-3 text-center text-gray-500 text-sm">
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
                  <td className="px-6 py-3">{item.code || '-'}</td>
                  <td className="px-6 py-3">{item.productName || '-'}</td>
                  <td className="px-6 py-3">{item.sizeName || '-'}</td>
                  <td className="px-6 py-3 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.colorCode }}
                    />
                    {item.colorName || '-'}
                  </td>
                  <td className="px-6 py-3">
                    <div
                      className="image-carousel"
                      onClick={() => item.images && item.images.length > 0 && openImageViewModal(item.images)}
                    >
                      {item.images && item.images.length > 0 ? (
                        <div
                          className="image-carousel-inner"
                          style={{
                            width: `${item.images.length * 48}px`,
                            animation: item.images.length > 1 ? `slide-${item.id} 10s infinite` : 'none',
                          }}
                        >
                          {item.images.map(img => (
                            <img
                              key={img.id}
                              src={`http://localhost:8080${img.url}`}
                              alt={`Image ${img.id}`}
                              className="w-12 h-12 object-cover rounded-md"
                              onError={() => console.error(`Failed to load image: http://localhost:8080${img.url}`)}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                    {item.images && item.images.length > 1 && (
                      <style>
                        {`
                          @keyframes slide-${item.id} {
                            ${Array.from({ length: item.images.length }, (_, i) => `
                              ${(i * 100) / item.images.length}% { transform: translateX(-${i * 48}px); }
                              ${((i + 1) * 100) / item.images.length}% { transform: translateX(-${i * 48}px); }
                            `).join('')}
                          }
                        `}
                      </style>
                    )}
                  </td>
                  <td className="px-6 py-3">{item.quantity || 0}</td>
                  <td className="px-6 py-3">{item.price ? item.price.toLocaleString('vi-VN') + ' VND' : '-'}</td>
                  <td className="px-6 py-3">{item.promotionalPrice ? item.promotionalPrice.toLocaleString('vi-VN') + ' VND' : '0'}</td>
                  <td className="px-6 py-3">{statusToVietnamese(item.status)}</td>
                  <td className="px-6 py-3">{formatDate(item.createdAt)}</td>
                  <td className="px-6 py-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleUpdate(item)}
                      className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <HiOutlinePencilAlt size={16} />
                    </button>
                    <button
                      onClick={() => generateAndDownloadQRCode(item.code)}
                      className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                      title="Tải mã QR"
                    >
                      <HiOutlineQrcode size={16} />
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

      {/* Các modal khác giữ nguyên như mã gốc */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              {isEditing ? 'Cập nhật chi tiết sản phẩm' : 'Thêm chi tiết sản phẩm mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              {isEditing && (
                <>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã chi tiết</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                      maxLength={5}
                      required
                    />
                  </div>
                </>
              )}
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
                  name="sizeIds"
                  value={sizes.filter(option => formData.sizeIds.includes(option.value))}
                  onChange={(selectedOptions) => handleSelectChange(selectedOptions, { name: 'sizeIds' })}
                  options={sizes}
                  placeholder="Chọn kích thước"
                  isSearchable
                  isMulti={!isEditing}
                  className="text-sm"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                <Select
                  name="colorIds"
                  value={colors.filter(option => formData.colorIds.includes(option.value))}
                  onChange={(selectedOptions) => handleSelectChange(selectedOptions, { name: 'colorIds' })}
                  options={colors}
                  placeholder="Chọn màu sắc"
                  isSearchable
                  isMulti={!isEditing}
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
              {isEditing && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    required
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="AVAILABLE">Còn hàng</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                    <option value="DISCONTINUED">Ngừng bán</option>
                  </select>
                </div>
              )}
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
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl shadow-xl overflow-y-auto max-h-[80vh]">
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
                    className="w-full h-48 object-cover rounded-lg shadow-md"
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

      {isImageViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Xem hình ảnh</h3>
            {selectedImagesForView.length > 0 ? (
              <div className="relative">
                <img
                  src={`http://localhost:8080${selectedImagesForView[currentImageIndex].url}`}
                  alt={`Image ${selectedImagesForView[currentImageIndex].id}`}
                  className="w-full h-96 object-contain rounded-lg"
                  onError={() => console.error(`Failed to load image: http://localhost:8080${selectedImagesForView[currentImageIndex].url}`)}
                />
                {selectedImagesForView.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      <HiChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      <HiChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {selectedImagesForView.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">Không có hình ảnh để hiển thị</p>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={closeImageViewModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác Nhận</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có muốn {isEditing ? 'cập nhật' : 'thêm mới'} chi tiết sản phẩm này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none transition-all duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa chi tiết sản phẩm này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
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