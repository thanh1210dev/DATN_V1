import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import DotGiamGiaApi from '../../../Service/AdminDotGiamGiaSevice/DotGiamGiaApi';


const ZeroPromotionProductDetails = ({ promotionId }) => {
  const [productDetails, setProductDetails] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    price: '',
  });
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchZeroPromotionProductDetails = async () => {
    setIsLoading(true);
    try {
      const response = await ProductDetailService.getAllWithZeroPromotionalPrice(
        filters.code || null,
        filters.name || null,
        filters.price || null,
        page,
        size
      );
      setProductDetails(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZeroPromotionProductDetails();
  }, [page, size, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleSelectDetail = (id) => {
    setSelectedDetails((prev) =>
      prev.includes(id) ? prev.filter((detailId) => detailId !== id) : [...prev, id]
    );
  };

  const handleSelectAllDetails = () => {
    if (selectedDetails.length === productDetails.length) {
      setSelectedDetails([]);
    } else {
      setSelectedDetails(productDetails.map((detail) => detail.id));
    }
  };

  const handleAssign = async () => {
    if (selectedDetails.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một chi tiết sản phẩm để gán vào đợt');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn gán các chi tiết sản phẩm này vào đợt giảm giá không?')) return;

    setIsLoading(true);
    try {
      const assignSingleRequests = selectedDetails.map((detailId) => ({
        promotionId: parseInt(promotionId),
        productDetailId: detailId,
      }));
      await Promise.all(
        assignSingleRequests.map((request) => DotGiamGiaApi.assignToSingle(request))
      );
      toast.success('Gán chi tiết sản phẩm vào đợt giảm giá thành công!');
      setSelectedDetails([]);
      fetchZeroPromotionProductDetails();
    } catch (error) {
      toast.error(error.message || 'Có lỗi khi gán chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const formatProductStatus = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">Còn hàng</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">Hết hàng</span>;
      case 'DISCONTINUED':
        return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">Ngừng bán</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="mb-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Chi tiết sản phẩm không có khuyến mãi</h2>
      <div className="bg-white shadow-md rounded-lg p-6 mb-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lọc chi tiết sản phẩm</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Mã chi tiết</label>
            <input
              type="text"
              name="code"
              value={filters.code}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập mã chi tiết"
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
            <label className="block text-sm font-medium text-gray-600 mb-1">Giá</label>
            <input
              type="number"
              name="price"
              value={filters.price}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập giá"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <button
          onClick={handleAssign}
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          disabled={isLoading}
        >
          Gắn Vào Đợt
        </button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-100 text-indigo-800">
            <tr>
              <th className="px-6 py-3 w-16">
                <input
                  type="checkbox"
                  checked={productDetails.length > 0 && selectedDetails.length === productDetails.length}
                  onChange={handleSelectAllDetails}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
              </th>
              <th className="px-6 py-3 w-16">#</th>
              <th className="px-6 py-3">Ảnh</th>
              <th className="px-6 py-3">Mã chi tiết</th>
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
                <td colSpan="10" className="px-6 py-4 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              productDetails.map((detail, index) => (
                <tr key={detail.id} className="border-b hover:bg-indigo-50 transition-colors">
                  <td className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedDetails.includes(detail.id)}
                      onChange={() => handleSelectDetail(detail.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isLoading}
                    />
                  </td>
                  <td className="px-6 py-3 text-center">{page * size + index + 1}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {detail.images && detail.images.map(img => (
                        <img
                          key={img.id}
                          src={`http://localhost:8080${img.url}`}
                          alt={`Image ${img.id}`}
                          className="w-12 h-12 object-cover rounded-md"
                          onError={() => console.error(`Failed to load image: http://localhost:8080${img.url}`)}
                        />
                      ))}
                      {!detail.images || detail.images.length === 0 && (
                        <span className="text-gray-500">Không có ảnh</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">{detail.code}</td>
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
                  <td className="px-6 py-3">{formatProductStatus(detail.status)}</td>
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
  );
};

export default ZeroPromotionProductDetails;