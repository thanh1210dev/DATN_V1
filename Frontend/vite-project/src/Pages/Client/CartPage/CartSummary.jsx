import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';

const CartSummary = ({ cartItems }) => {
  const [shippingFee, setShippingFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const fetchShippingFee = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        // Fetch default address for shipping cost calculation
        const addressResponse = await axiosInstance.get(`/customer-information/user/${userId}`);
        const defaultAddress = addressResponse.data.find((addr) => addr.isDefault);
        if (!defaultAddress) {
          setShippingFee(0); // No default address, set to 0
          return;
        }
        const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);
        const response = await axiosInstance.post('/cart-checkout/calculate-shipping', {
          toDistrictId: defaultAddress.districtId,
          toWardCode: defaultAddress.wardCode,
          weight: totalWeight,
          length: 30,
          width: 20,
          height: 10,
        });
        setShippingFee(response.data || 0);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi tính phí vận chuyển', {
          position: 'top-right',
          autoClose: 3000,
        });
        setShippingFee(0);
      } finally {
        setIsLoading(false);
      }
    };
    if (cartItems.length > 0) fetchShippingFee();
  }, [cartItems]);

  const total = subtotal + shippingFee;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Tóm Tắt Đơn Hàng</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tính phí vận chuyển...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tạm tính:</span>
            <span>{subtotal.toLocaleString('vi-VN')} VND</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Phí vận chuyển:</span>
            <span>{shippingFee.toLocaleString('vi-VN')} VND</span>
          </div>
          <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-4">
            <span>Tổng cộng:</span>
            <span>{total.toLocaleString('vi-VN')} VND</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300 text-center"
          >
            Tiến hành thanh toán
          </Link>
        </div>
      )}
    </div>
  );
};

export default CartSummary;