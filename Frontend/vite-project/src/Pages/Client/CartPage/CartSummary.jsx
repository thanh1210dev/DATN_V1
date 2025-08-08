import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';

const CartSummary = ({ cartItems, selectedItems }) => {
  const [shippingFee, setShippingFee] = useState(22000);
  const [isLoading, setIsLoading] = useState(false);

  // Đảm bảo cartItems và selectedItems là array trước khi tính toán
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const safeSelectedItems = Array.isArray(selectedItems) ? selectedItems : [];
  
  // Tính tổng tiền chỉ cho các sản phẩm đã chọn
  const subtotal = safeSelectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchShippingFee = async () => {
      // Reset về 0 nếu không có sản phẩm được chọn
      if (!safeSelectedItems.length) {
        setShippingFee(0);
        return;
      }

      try {
        setIsLoading(true);
        
        // Kiểm tra authentication trước khi lấy địa chỉ
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
          console.log('No auth data in CartSummary');
          if (isMounted) setShippingFee(22000);
          return;
        }
        
        // Kiểm tra token còn hợp lệ không
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp < currentTime) {
            console.log('Token expired in CartSummary');
            if (isMounted) setShippingFee(22000);
            return;
          }
        } catch (error) {
          console.log('Invalid token in CartSummary');
          if (isMounted) setShippingFee(22000);
          return;
        }
        
        const userId = user.id;
        if (!userId || isNaN(userId) || parseInt(userId) <= 0) {
          console.log('UserId không hợp lệ:', userId);
          if (isMounted) setShippingFee(22000);
          return;
        }

        // Lấy danh sách địa chỉ với timeout và abort controller
        const addressResponse = await axiosInstance.get(`/cart-checkout/address/${userId}`, {
          signal: controller.signal
        }).catch(error => {
          console.log('Lỗi khi lấy địa chỉ:', error);
          return { data: [] };
        });

        // Kiểm tra component còn mounted không
        if (!isMounted) return;

        const addresses = Array.isArray(addressResponse.data) ? addressResponse.data : [];
        console.log('Số địa chỉ nhận được:', addresses.length);

        // Tìm địa chỉ mặc định hợp lệ
        const defaultAddress = addresses.find(addr => (
          addr && 
          addr.isDefault === true && 
          addr.districtId && 
          addr.wardCode
        ));

        // Nếu không có địa chỉ hợp lệ, dùng phí mặc định
        if (!defaultAddress) {
          console.log('Không tìm thấy địa chỉ mặc định hợp lệ');
          if (isMounted) setShippingFee(22000);
          return;
        }

        // Tính tổng cân nặng cho các sản phẩm đã chọn (tối thiểu 500g mỗi sản phẩm)
        const totalWeight = safeSelectedItems.reduce((sum, item) => {
          const weight = item.weight > 0 ? item.weight : 500;
          return sum + (weight * item.quantity);
        }, 0);

        // Gọi API tính phí ship
        const shippingResponse = await axiosInstance.post('/cart-checkout/calculate-shipping', {
          toDistrictId: defaultAddress.districtId,
          toWardCode: defaultAddress.wardCode,
          weight: totalWeight,
          length: 30,
          width: 20,
          height: 10
        }).catch(error => {
          console.log('Lỗi khi tính phí ship:', error);
          return { data: 22000 };
        });

        // Kiểm tra component còn mounted không
        if (!isMounted) return;

        // Xử lý response phí ship
        const fee = typeof shippingResponse.data === 'number' ? 
          shippingResponse.data : 22000;

        console.log('Phí vận chuyển:', fee);
        setShippingFee(fee);

      } catch (error) {
        console.error('Lỗi khi tính phí vận chuyển:', error);
        if (isMounted) setShippingFee(22000);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchShippingFee();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
      }, [safeSelectedItems]); // Thay đổi dependency để tính phí ship cho sản phẩm đã chọn

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
          {safeSelectedItems.length > 0 ? (
            <Link
              to="/checkout"
              state={{ selectedItems: safeSelectedItems }}
              className="mt-6 block w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300 text-center"
            >
              Tiến hành thanh toán ({safeSelectedItems.length} sản phẩm)
            </Link>
          ) : (
            <div className="mt-6 block w-full px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg text-center cursor-not-allowed">
              Vui lòng chọn sản phẩm để thanh toán
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartSummary;