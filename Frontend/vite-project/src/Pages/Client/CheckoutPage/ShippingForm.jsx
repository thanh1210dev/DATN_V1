import React from "react";

const ShippingForm = ({ shippingInfo, setShippingInfo }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-lg font-bold text-indigo-700 mb-4">Thông Tin Giao Hàng</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Họ Tên</label>
          <input
            type="text"
            value={shippingInfo.name}
            onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Địa Chỉ</label>
          <input
            type="text"
            value={shippingInfo.address}
            onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Số Điện Thoại</label>
          <input
            type="text"
            value={shippingInfo.phone}
            onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingForm;