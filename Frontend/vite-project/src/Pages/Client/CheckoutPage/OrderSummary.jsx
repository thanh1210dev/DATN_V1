import React from 'react';

const OrderSummary = ({ cartItems, shippingFee, reductionAmount, onPlaceOrder, step, selectedAddressId, paymentMethod }) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingFee - (reductionAmount || 0);

  // Debug log cho button state
  console.log('🔍 [ORDER SUMMARY DEBUG] Current state:', {
    step, 
    selectedAddressId, 
    paymentMethod,
    shouldEnableButton: step === 2 && selectedAddressId && paymentMethod
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Tóm Tắt Đơn Hàng</h2>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-gray-600">
            <span>
              {item.productName} ({item.productColor}, {item.productSize}) x {item.quantity}
              <br />
              <span className="text-xs">Trọng lượng: {(item.weight || 500) * item.quantity}g</span>
            </span>
            <span>{(item.price * item.quantity).toLocaleString('vi-VN')} VND</span>
          </div>
        ))}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tạm tính:</span>
          <span>{subtotal.toLocaleString('vi-VN')} VND</span>
        </div>
        {reductionAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Giảm giá (Voucher):</span>
            <span>-{reductionAmount.toLocaleString('vi-VN')} VND</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Phí vận chuyển:</span>
          <span>{shippingFee.toLocaleString('vi-VN')} VND</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>Tổng cộng:</span>
          <span>{total.toLocaleString('vi-VN')} VND</span>
        </div>
        {/* Chỉ hiển thị nút đặt hàng khi đã hoàn thành tất cả các bước */}
        {step === 2 && selectedAddressId && paymentMethod ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Thêm class để nhận dạng (tránh xung đột)
              const target = e.currentTarget || e.target;
              if (target && typeof target.className === 'string') {
                target.className += ' payment-btn-clicked';
              }
              
              // Gọi hàm xử lý với tham số là sự kiện đã xử lý
              if (typeof onPlaceOrder === 'function') {
                onPlaceOrder({...e, preventDefault: () => {}, target});
              }
            }}
            type="button"
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Đặt Hàng
          </button>
        ) : (
          <div className="w-full px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg text-center">
            {step === 1 ? 'Vui lòng chọn địa chỉ giao hàng' : 
             step === 2 && !selectedAddressId ? 'Vui lòng chọn địa chỉ giao hàng' :
             step === 2 && !paymentMethod ? 'Vui lòng chọn phương thức thanh toán' :
             'Hoàn tất các bước để đặt hàng'}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;