
import React from 'react';

const OrderStatus = ({ status }) => {
  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMING: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    SHIPPING: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-teal-100 text-teal-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const statusText = {
    PENDING: 'Chờ xử lý',
    CONFIRMING: 'Đang xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
  };

  return (
    <div className="mb-6">
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {statusText[status] || status}
      </span>
    </div>
  );
};

export default OrderStatus;
