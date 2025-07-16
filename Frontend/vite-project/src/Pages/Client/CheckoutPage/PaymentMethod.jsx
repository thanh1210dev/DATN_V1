import React from 'react';

const PaymentMethod = ({ paymentMethod, setPaymentMethod }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Phương Thức Thanh Toán</h2>
      <div className="space-y-4">
        <label className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition duration-200">
          <input
            type="radio"
            value="COD"
            checked={paymentMethod === 'COD'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <div className="ml-4">
            <span className="text-sm font-medium text-gray-900">Thanh toán khi nhận hàng</span>
            <p className="text-xs text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</p>
          </div>
        </label>
        <label className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition duration-200">
          <input
            type="radio"
            value="BANKING"
            checked={paymentMethod === 'BANKING'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <div className="ml-4">
            <span className="text-sm font-medium text-gray-900">Thanh toán qua ngân hàng</span>
            <p className="text-xs text-gray-500">Chuyển khoản qua ngân hàng</p>
          </div>
        </label>
        <label className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition duration-200">
          <input
            type="radio"
            value="VNPAY"
            checked={paymentMethod === 'VNPAY'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <div className="ml-4">
            <span className="text-sm font-medium text-gray-900">Thanh toán qua VNPay</span>
            <p className="text-xs text-gray-500">Quét mã QR hoặc sử dụng ứng dụng VNPay</p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default PaymentMethod;

