import React from "react";

const PaymentMethod = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-lg font-bold text-indigo-700 mb-4">Phương Thức Thanh Toán</h2>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Thanh toán khi nhận hàng</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="CARD"
            checked={paymentMethod === "CARD"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Thẻ tín dụng</span>
        </label>
      </div>
    </div>
  );
};

export default PaymentMethod;