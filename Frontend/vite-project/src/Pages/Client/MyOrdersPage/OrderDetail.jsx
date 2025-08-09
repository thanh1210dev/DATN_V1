import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';
import AuthService from '../../../Service/AuthService';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Sản phẩm lỗi/không đúng mô tả');
  const [returnItems, setReturnItems] = useState({}); // billDetailId -> qty
  const [returnFiles, setReturnFiles] = useState([]);
  const [creatingReturn, setCreatingReturn] = useState(false);

  // Mapping trạng thái đơn hàng (đồng bộ backend)
  const statusMapping = {
    PENDING: 'Chờ xử lý',
    CONFIRMING: 'Đang xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKED: 'Đã đóng gói',
    DELIVERING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    RETURN_REQUESTED: 'Yêu cầu trả hàng',
    RETURNED: 'Đã trả hàng',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn tiền một phần',
    RETURN_COMPLETED: 'Đã trả xong',
    DELIVERY_FAILED: 'Giao hàng thất bại',
  };

  // Màu sắc cho từng trạng thái
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMING: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PACKED: 'bg-cyan-100 text-cyan-800',
    DELIVERING: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-teal-100 text-teal-800',
    PAID: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    RETURN_REQUESTED: 'bg-orange-50 text-orange-700',
    RETURNED: 'bg-orange-100 text-orange-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    RETURN_COMPLETED: 'bg-gray-100 text-gray-800',
    DELIVERY_FAILED: 'bg-red-100 text-red-800',
  };

  useEffect(() => {
    // Xóa flag VNPAY success transition khi vào trang order detail
    // để đảm bảo không ảnh hưởng đến logic authentication
    sessionStorage.removeItem('vnpaySuccessTransition');
    
    const user = AuthService.getCurrentUser();
    if (!user) {
      toast.error('Vui lòng đăng nhập để xem đơn hàng', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
      return;
    }
    fetchOrderDetail();
  }, [orderId, navigate]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      
      const [orderResponse, detailsResponse] = await Promise.all([
        axiosInstance.get(`/bills/${orderId}`),
        axiosInstance.get(`/bills/${orderId}/details`)
      ]);
      
      setOrder(orderResponse.data);
      
      // Check if we got HTML response (authentication error)
      if (typeof detailsResponse.data === 'string' && detailsResponse.data.includes('<!DOCTYPE html>')) {
        setOrderDetails([]);
        toast.error('Lỗi xác thực khi lấy chi tiết đơn hàng', { position: 'top-right', autoClose: 3000 });
        return;
      }
      
      // Đảm bảo orderDetails luôn là array
      const details = detailsResponse.data;
      if (Array.isArray(details)) {
        setOrderDetails(details);
      } else if (details && typeof details === 'object' && details.content) {
        // Nếu API trả về dạng pagination response
        setOrderDetails(Array.isArray(details.content) ? details.content : []);
      } else {
        setOrderDetails([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
      toast.error('Không thể tải chi tiết đơn hàng', { position: 'top-right', autoClose: 3000 });
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('vi-VN') + ' VND' || '0 VND';
  };

  const translateStatusVi = (status) => ({
    PENDING: 'Chờ xử lý',
    CONFIRMING: 'Đang xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKED: 'Đã đóng gói',
    DELIVERING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    RETURN_REQUESTED: 'Yêu cầu trả hàng',
    RETURNED: 'Đã trả hàng',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn tiền một phần',
    RETURN_COMPLETED: 'Đã trả xong',
  }[status] || status);

  const cancelOrder = async () => {
    if (!order) return;
    if (!['PENDING','CONFIRMING'].includes(order.status)) {
      toast.error('Chỉ có thể hủy khi đơn đang chờ xử lý/xác nhận');
      return;
    }
    try {
      setSubmitting(true);
      await axiosInstance.put(`/bills/${orderId}/status`, null, { params: { status: 'CANCELLED' }});
      toast.success('Đã hủy đơn hàng');
      fetchOrderDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Hủy đơn hàng thất bại');
    } finally { setSubmitting(false); }
  };

  const requestReturn = async () => {
    if (!order) return;
    if (!['DELIVERED','COMPLETED'].includes(order.status)) {
      toast.error('Chỉ có thể yêu cầu trả hàng khi đơn đã giao/hoàn thành');
      return;
    }
    // Initialize quantities to 0 for all items
    const init = {};
    (orderDetails || []).forEach(it => { if (it?.id != null) init[it.id] = 0; });
    setReturnItems(init);
    setShowReturnModal(true);
  };

  const requestRefund = async () => {
    if (!order) return;
    if (order.status !== 'RETURNED') {
      toast.error('Chỉ hoàn tiền sau khi hàng đã được trả về');
      return;
    }
    try {
      setSubmitting(true);
      await axiosInstance.put(`/bills/${orderId}/status`, null, { params: { status: 'REFUNDED' }});
      toast.success('Đã yêu cầu hoàn tiền');
      fetchOrderDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Yêu cầu hoàn tiền thất bại');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Không tìm thấy đơn hàng</h3>
          <Link to="/my-orders" className="mt-4 text-indigo-600 hover:text-indigo-900">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/my-orders" 
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại danh sách đơn hàng
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng #{order.code}</h1>
          <div className="mt-2 flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
              {statusMapping[order.status]}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Đặt ngày: {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Thông báo đặc biệt cho trạng thái CONFIRMING */}
          {order.status === 'CONFIRMING' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Đơn hàng đang chờ xác nhận
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Đơn hàng của bạn đã được thanh toán thành công và đang chờ xác nhận từ cửa hàng. 
                      Chúng tôi sẽ xử lý và cập nhật trạng thái đơn hàng trong thời gian sớm nhất.
                    </p>
                    <p className="mt-1 font-medium">
                      Thời gian xác nhận dự kiến: 1-2 giờ trong giờ hành chính
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thông tin đơn hàng */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Thông tin đơn hàng</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin người nhận</h4>
                  <p className="text-sm text-gray-900">{order.customerName}</p>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Số điện thoại</h4>
                  <p className="text-sm text-gray-900">{order.phoneNumber}</p>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Địa chỉ giao hàng</h4>
                  <p className="text-sm text-gray-900 mt-2">{order.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin thanh toán</h4>
                  <p className="text-sm text-gray-900">Phương thức: {order.type || order.paymentType || 'N/A'}</p>
                  <p className="text-sm text-gray-900">
                    Trạng thái: {statusMapping[order.status] || order.status || 'N/A'}
                  </p>
                   {/* Hiển thị thông tin thanh toán dựa trên trạng thái và phương thức */}
                  {order.type === 'COD' && order.status !== 'COMPLETED' && (
                    <p className="text-sm text-yellow-600">
                      Thanh toán khi nhận hàng: {formatPrice(order.finalAmount || order.totalAmount || 0)}
                    </p>
                  )}
                  {(order.type === 'ONLINE' || order.type === 'BANKING') && (order.customerPayment || 0) > 0 && (
                    <p className="text-sm text-green-600">
                      Đã thanh toán: {formatPrice(order.customerPayment || 0)}
                    </p>
                  )}
                  {(order.type === 'ONLINE' || order.type === 'BANKING') && (order.customerPayment || 0) === 0 && (
                    <p className="text-sm text-red-600">
                      Chưa thanh toán: {formatPrice(order.finalAmount || order.totalAmount || 0)}
                    </p>
                  )}
                  {order.type === 'COD' && order.status === 'COMPLETED' && (order.customerPayment || 0) > 0 && (
                    <p className="text-sm text-green-600">
                      Đã thanh toán: {formatPrice(order.customerPayment || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

           {/* Sản phẩm trong đơn hàng */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sản phẩm đã đặt</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {Array.isArray(orderDetails) && orderDetails.filter(it => it.status !== 'RETURNED').length > 0 ? (
                  orderDetails.filter(it => it.status !== 'RETURNED').map((item, index) => (
                    <div key={item.id || index} className="flex items-center py-4 border-b border-gray-100 last:border-b-0">
                      <img
                        src={
                          // Try multiple possible image field structures
                          (item.productImage && Array.isArray(item.productImage) && item.productImage.length > 0)
                            ? `http://localhost:8080${item.productImage[0].url}`
                            : (item.images && Array.isArray(item.images) && item.images.length > 0)
                            ? `http://localhost:8080${item.images[0].url}`
                            : (item.productDetailImage && Array.isArray(item.productDetailImage) && item.productDetailImage.length > 0)
                            ? `http://localhost:8080${item.productDetailImage[0].url}`
                            : 'https://via.placeholder.com/80'
                        }
                        alt={item.productName || item.name || 'Product'}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80';
                        }}
                      />
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.productName || item.name || 'Tên sản phẩm không có'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Màu: {item.productColor || item.colorName || item.color || 'N/A'} | 
                          Kích cỡ: {item.productSize || item.sizeName || item.size || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">Số lượng: {item.quantity || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(item.totalPrice || item.price || item.unitPrice || 0)}
                        </p>
                        {(item.promotionalPrice && item.promotionalPrice !== (item.price || item.unitPrice)) && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(item.price || item.unitPrice || 0)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
        ) : (
                  <div className="text-center py-8">
          <p className="text-gray-500">Không có sản phẩm hiển thị (các sản phẩm đã trả sẽ được ẩn khỏi danh sách).</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tóm tắt thanh toán */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tóm tắt thanh toán</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="text-gray-900">{formatPrice(order.totalMoney || order.subTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="text-gray-900">{formatPrice(order.moneyShip || order.shippingFee || 0)}</span>
                </div>
                {(order.reductionAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="text-green-600">-{formatPrice(order.reductionAmount || 0)}</span>
                  </div>
                )}
                {order.voucherCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mã voucher:</span>
                    <span className="text-gray-900">{order.voucherCode}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-base font-medium">
                    <span className="text-gray-900">Tổng cộng:</span>
                    <span className="text-indigo-600">{formatPrice(order.finalAmount || order.totalAmount || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline trạng thái đơn hàng */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lịch sử đơn hàng</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="bg-indigo-500 h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Đơn hàng đã được tạo với trạng thái{' '}
                              <span className="font-medium text-gray-900">{statusMapping[order.status]}</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-3">
                {['PENDING','CONFIRMING'].includes(order.status) && (
                  <button onClick={cancelOrder} disabled={submitting} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                    Hủy đơn hàng
                  </button>
                )}
                {['DELIVERED','COMPLETED'].includes(order.status) && (
                  <button onClick={requestReturn} disabled={submitting} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50">
                    Yêu cầu trả hàng
                  </button>
                )}
                {order.status === 'RETURNED' && (
                  <button onClick={requestRefund} disabled={submitting} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
                    Yêu cầu hoàn tiền
                  </button>
                )}
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Tạo yêu cầu trả hàng</h3>
            <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3}
                          value={returnReason} onChange={e=>setReturnReason(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm và số lượng trả</label>
                <div className="space-y-2">
                  {(orderDetails||[]).filter(it => it.status !== 'RETURNED').map(it => {
                    const maxQty = it.quantity || 0;
                    const imgSrc = (it.productImage && Array.isArray(it.productImage) && it.productImage.length > 0)
                      ? `http://localhost:8080${it.productImage[0].url}`
                      : (it.images && Array.isArray(it.images) && it.images.length > 0)
                      ? `http://localhost:8080${it.images[0].url}`
                      : (it.productDetailImage && Array.isArray(it.productDetailImage) && it.productDetailImage.length > 0)
                      ? `http://localhost:8080${it.productDetailImage[0].url}`
                      : 'https://via.placeholder.com/40';
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-3 border rounded p-2">
                        <div className="flex items-center gap-3">
                          <img src={imgSrc} className="w-10 h-10 object-cover rounded" />
                          <div>
                            <div className="text-sm font-medium">{it.productName || it.name || 'Sản phẩm'}</div>
                            <div className="text-xs text-gray-500">SL mua: {maxQty}</div>
                          </div>
                        </div>
                        <input type="number" min={0} max={maxQty}
                               value={returnItems[it.id] ?? 0}
                               onChange={e => setReturnItems(prev=>({
                                 ...prev,
                                 [it.id]: Math.max(0, Math.min(maxQty, Number(e.target.value)||0))
                               }))}
                               className="w-24 border rounded px-2 py-1 text-sm text-right" />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh/Video minh chứng</label>
                <input type="file" accept="image/*,video/*" multiple onChange={(e)=>setReturnFiles(Array.from(e.target.files||[]))} />
                <p className="text-xs text-gray-500 mt-1">Tối đa ~15MB mỗi file (theo cấu hình backend).</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm border rounded" onClick={()=>setShowReturnModal(false)}>Hủy</button>
              <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded disabled:opacity-50" disabled={creatingReturn}
                      onClick={async ()=>{
                        try {
                          const payloadItems = Object.entries(returnItems)
                            .filter(([,qty])=> (qty||0) > 0)
                            .map(([billDetailId,qty])=>({ billDetailId: Number(billDetailId), quantity: Number(qty) }));
                          if (payloadItems.length === 0) { toast.error('Vui lòng chọn sản phẩm và số lượng cần trả'); return; }
                          setCreatingReturn(true);
                          const payload = { reason: returnReason, fullReturn: false, items: payloadItems };
                          await HoaDonApi.createReturnWithFiles(orderId, payload, returnFiles);
                          toast.success('Đã gửi yêu cầu trả hàng');
                          setShowReturnModal(false);
                          await fetchOrderDetail();
                        } catch (err) {
                          toast.error(err.message || 'Không gửi được yêu cầu trả');
                        } finally {
                          setCreatingReturn(false);
                        }
                      }}> {creatingReturn ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
