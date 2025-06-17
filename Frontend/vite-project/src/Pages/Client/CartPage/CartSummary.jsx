import React from "react";

const CartSummary = ({ cartItems }) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-indigo-700 mb-4">Tóm Tắt Đơn Hàng</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Tạm tính:</span>
          <span>{total} VND</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>Tổng cộng:</span>
          <span>{total} VND</span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;