import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import MyOrders from "./MyOrders";
import AuthService from "../../../Service/AuthService";

const Profile = () => {
  const user = AuthService.getCurrentUser();
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6">Trang Cá Nhân</h1>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Tên: {user?.name}</p>
          <p className="text-sm text-gray-600">ID: {user?.id}</p>
        </div>
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "orders" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-600"}`}
          >
            Đơn Hàng Của Tôi
          </button>
        </div>
        {activeTab === "orders" && <MyOrders />}
      </div>
    </div>
  );
};

export default Profile;