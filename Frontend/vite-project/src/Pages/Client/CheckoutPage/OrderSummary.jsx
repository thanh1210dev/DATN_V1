import React from 'react';

const OrderSummary = ({ cartItems, shippingFee, reductionAmount, onPlaceOrder, step, selectedAddressId, paymentMethod, allowPlaceOrder }) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingFee - (reductionAmount || 0);

  // Debug log cho button state
  console.log('🔍 [ORDER SUMMARY DEBUG] Current state:', {
    step, 
    selectedAddressId, 
    paymentMethod,
    allowPlaceOrder
  });

  // Debug log cho cartItems
  console.log('🛒 [ORDER SUMMARY DEBUG] Cart items:', cartItems.map(item => ({
    id: item.id,
    productName: item.productName,
    productColor: item.productColor,
    productSize: item.productSize,
    hasColor: !!item.productColor,
    hasSize: !!item.productSize
  })));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Tóm Tắt Đơn Hàng</h2>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-start space-x-3 text-sm">
            <img
              src={item.images?.[0]?.url ? `http://localhost:8080${item.images[0].url}` : '/no-image.jpg'}
              alt={item.productName}
              className="w-12 h-12 object-cover rounded-md"
              onError={(e) => {
                e.target.src = '/no-image.jpg';
              }}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.productName}</div>
              <div className="text-xs text-gray-500 space-y-1">
                {item.productColor ? (
                  <div>Màu: <span className="font-medium text-blue-600">{item.productColor}</span></div>
                ) : (
                  <div className="text-orange-500">⚠️ Chưa có thông tin màu</div>
                )}
                {item.productSize ? (
                  <div>Size: <span className="font-medium text-green-600">{item.productSize}</span></div>
                ) : (
                  <div className="text-orange-500">⚠️ Chưa có thông tin size</div>
                )}
                <div>Số lượng: <span className="font-medium">{item.quantity}</span></div>
                <div>Trọng lượng: <span className="font-medium">{(item.weight || 500) * item.quantity}g</span></div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {(item.price * item.quantity).toLocaleString('vi-VN')} VND
              </div>
              <div className="text-xs text-gray-500">
                {item.price.toLocaleString('vi-VN')} × {item.quantity}
              </div>
            </div>
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
    {/* Nút đặt hàng: dùng allowPlaceOrder để hỗ trợ cả guest và logged-in */}
    {allowPlaceOrder ? (
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
      {step === 1 ? 'Vui lòng nhập địa chỉ giao hàng' : 
       step === 2 && !paymentMethod ? 'Vui lòng chọn phương thức thanh toán' :
       'Hoàn tất các bước để đặt hàng'}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;