import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OrderStatus from "./OrderStatus";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const foundOrder = orders.find((o) => o.id === parseInt(id));
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      toast.error("Không tìm thấy đơn hàng", { position: "top-right", autoClose: 3000 });
    }
  }, [id]);

  if (!order) {
    return <div className="p-6 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6">Chi Tiết Đơn Hàng #{order.id}</h1>
        <OrderStatus status={order.status} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông Tin Giao Hàng</h2>
            <p className="text-sm text-gray-600">Tên: {order.shippingInfo.name}</p>
            <p className="text-sm text-gray-600">Địa chỉ: {order.shippingInfo.address}</p>
            <p className="text-sm text-gray-600">Số điện thoại: {order.shippingInfo.phone}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sản Phẩm</h2>
            {order.items.map((item) => (
              <div key={item.productDetailId} className="flex justify-between border-b py-2">
                <span>
                  {item.productName} ({item.color}, {item.size})
                </span>
                <span>
                  {item.quantity} x {item.price} VND
                </span>
              </div>
            ))}
            <p className="text-sm font-semibold text-gray-800 mt-4">Tổng: {order.total} VND</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;