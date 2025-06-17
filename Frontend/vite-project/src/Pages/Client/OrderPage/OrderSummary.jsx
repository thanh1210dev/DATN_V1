import React from "react";

const OrderSummary = ({ cartItems, onPlaceOrder }) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-indigo-700 mb-4">Tóm Tắt Đơn Hàng</h2>
      <div className="space-y-2">
        {cartItems.map((item) => (
          <div key={item.productDetailId} className="flex justify-between text-sm">
            <span>
              {item.productName} ({item.color}, {item.size}) x {item.quantity}
            </span>
            <span>{item.price * item.quantity} VND</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold">
          <span>Tổng cộng:</span>
          <span>{total} VND</span>
        </div>
      </div>
      <button
        onClick={onPlaceOrder}
        className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
      >
        Đặt Hàng
      </button>
    </div>
  );
};

export default OrderSummary;