import React from "react";

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="flex items-center border-b py-4">
      <img
        src="https://via.placeholder.com/100"
        alt={item.productName}
        className="w-20 h-20 object-cover rounded-lg"
      />
      <div className="flex-1 ml-4">
        <h3 className="text-sm font-semibold text-gray-800">{item.productName}</h3>
        <p className="text-sm text-gray-600">Màu: {item.color}</p>
        <p className="text-sm text-gray-600">Kích cỡ: {item.size}</p>
        <p className="text-sm text-indigo-600">{item.price} VND</p>
        <div className="flex items-center mt-2">
          <label className="text-sm text-gray-700 mr-2">Số lượng:</label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdateQuantity(item.productDetailId, parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 border border-indigo-200 rounded-lg text-sm"
          />
        </div>
      </div>
      <button
        onClick={() => onRemoveItem(item.productDetailId)}
        className="text-red-600 hover:text-red-700"
      >
        Xóa
      </button>
    </div>
  );
};

export default CartItem;