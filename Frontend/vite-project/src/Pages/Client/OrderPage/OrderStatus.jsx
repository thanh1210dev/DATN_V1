import React from "react";

const OrderStatus = ({ status }) => {
  const statusLabels = {
    PENDING: "Đang chờ xử lý",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đang giao",
    DELIVERED: "Đã giao",
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Trạng Thái Đơn Hàng</h2>
      <p className="text-sm text-indigo-600">{statusLabels[status] || status}</p>
    </div>
  );
};

export default OrderStatus;