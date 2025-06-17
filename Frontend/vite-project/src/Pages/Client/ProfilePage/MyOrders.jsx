import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(allOrders.slice(page * size, (page + 1) * size));
  }, [page, size]);

  return (
    <div>
      <ToastContainer />
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Đơn Hàng Của Tôi</h2>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-gray-500">Bạn chưa có đơn hàng nào</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Đơn hàng #{order.id}</p>
                  <p className="text-sm text-gray-600">Ngày đặt: {new Date(order.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Tổng: {order.total} VND</p>
                </div>
                <Link
                  to={`/order/${order.id}`}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
            Trang {page + 1}
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={orders.length < size}
          >
            Tiếp →
          </button>
        </div>
        <select
          value={size}
          onChange={(e) => {
            setSize(parseInt(e.target.value));
            setPage(0);
          }}
          className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm"
        >
          <option value={5}>5 / trang</option>
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
        </select>
      </div>
    </div>
  );
};

export default MyOrders;