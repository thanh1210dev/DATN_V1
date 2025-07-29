import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderStatus from './OrderStatus';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Gọi trực tiếp API lấy bill theo id
        const response = await axiosInstance.get(`/cart-checkout/bill/${id}`);
        setOrder(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không tìm thấy đơn hàng', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const user = AuthService.getCurrentUser();
      if (!user || !user.id) {
        toast.error('Vui lòng đăng nhập để tiếp tục', { position: 'top-right', autoClose: 3000 });
        navigate('/login');
        return;
      }

      await axiosInstance.post(`/cart-checkout/cancel-order/${id}?userId=${user.id}`);
      
      toast.success('Hủy đơn hàng thành công!', { position: 'top-right', autoClose: 3000 });
      
      // Reload order data để cập nhật trạng thái
      const response = await axiosInstance.get(`/cart-checkout/bill/${id}`);
      setOrder(response.data);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy đơn hàng', { position: 'top-right', autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Kiểm tra xem có thể hủy đơn hàng không
  const canCancelOrder = () => {
    return order && (order.status === 'PENDING' || order.status === 'CONFIRMING');
  };

  if (!order) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-lg">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chi Tiết Đơn Hàng #{order.code}</h1>
          {canCancelOrder() && (
            <button
              onClick={handleCancelOrder}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-medium ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } transition-colors`}
            >
              {isLoading ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </button>
          )}
        </div>
        <OrderStatus status={order.status} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Giao Hàng</h2>
            <p className="text-sm text-gray-600">Tên: {order.customerName}</p>
            <p className="text-sm text-gray-600">
              Địa chỉ: {order.address}, {order.wardName}, {order.districtName}, {order.provinceName}
            </p>
            <p className="text-sm text-gray-600">Số điện thoại: {order.phoneNumber}</p>
            <p className="text-sm text-gray-600">Phương thức thanh toán: {order.paymentType || order.type}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sản Phẩm</h2>
            {order.items && order.items.length > 0 ? order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b py-3 text-sm text-gray-600">
                <span>
                  {item.productName} ({item.productColor}, {item.productSize}) x {item.quantity}
                  <br />
                  <span className="text-xs">Trọng lượng: {(item.weight || 500) * item.quantity}g</span>
                </span>
                <span>{(item.price * item.quantity).toLocaleString('vi-VN')} VND</span>
              </div>
            )) : <p className="text-sm text-gray-500">Không có sản phẩm</p>}
            <div className="flex justify-between text-sm text-gray-600 mt-4">
              <span>Tạm tính:</span>
              <span>{order.totalMoney.toLocaleString('vi-VN')} VND</span>
            </div>
            {order.reductionAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 mt-2">
                <span>Giảm giá (Voucher):</span>
                <span>-{order.reductionAmount.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Phí vận chuyển:</span>
              <span>{(order.moneyShip || 0).toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900 mt-2">
              <span>Tổng cộng:</span>
              <span>{order.finalAmount.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;