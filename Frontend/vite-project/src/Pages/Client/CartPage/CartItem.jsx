import React, { useState } from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300">
      <img
        src={item.images?.[0]?.url ? `http://localhost:8080${item.images[0].url}` : 'https://via.placeholder.com/100'}
        alt={item.productName}
        className="w-24 h-24 object-cover rounded-lg"
      />
      <div className="flex-1 ml-6">
        <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
        <p className="text-sm text-gray-600">Màu: {item.productColor}</p>
        <p className="text-sm text-gray-600">Kích cỡ: {item.productSize}</p>
        
        <p className="text-lg font-medium text-indigo-600">{item.price.toLocaleString('vi-VN')} VND</p>
        <div className="flex items-center mt-4 space-x-2">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={() => onRemoveItem(item.id)}
        className="text-red-600 hover:text-red-700 font-medium transition duration-200"
      >
        Xóa
      </button>
    </div>
  );
};

export default CartItem;