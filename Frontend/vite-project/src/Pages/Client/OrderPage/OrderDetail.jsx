import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderStatus from './OrderStatus';
import axiosInstance from '../../../Service/axiosInstance';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Vui lòng đăng nhập để xem đơn hàng', { position: 'top-right', autoClose: 3000 });
          return;
        }
        const response = await axiosInstance.get(`/cart-checkout/bills?userId=${userId}&page=0&size=1`);
        const orderData = response.data.content.find((o) => o.id === parseInt(id));
        if (!orderData) {
          throw new Error('Không tìm thấy đơn hàng');
        }
        setOrder(orderData);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không tìm thấy đơn hàng', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchOrder();
  }, [id]);

  if (!order) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-lg">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chi Tiết Đơn Hàng #{order.code}</h1>
        <OrderStatus status={order.status} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Giao Hàng</h2>
            <p className="text-sm text-gray-600">Tên: {order.customerInfor?.name}</p>
            <p className="text-sm text-gray-600">
              Địa chỉ: {order.customerInfor?.address}, {order.customerInfor?.wardName}, {order.customerInfor?.districtName}, {order.customerInfor?.provinceName}
            </p>
            <p className="text-sm text-gray-600">Số điện thoại: {order.customerInfor?.phoneNumber}</p>
            <p className="text-sm text-gray-600">Phương thức thanh toán: {order.paymentMethod}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sản Phẩm</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b py-3 text-sm text-gray-600">
                <span>
                  {item.productName} ({item.productColor}, {item.productSize}) x {item.quantity}
                  <br />
                  <span className="text-xs">Trọng lượng: {(item.weight || 500) * item.quantity}g</span>
                </span>
                <span>{(item.price * item.quantity).toLocaleString('vi-VN')} VND</span>
              </div>
            ))}
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