import React, { useState } from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemoveItem, isSelected, onSelectItem }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  // Debug log để xem cấu trúc dữ liệu
  console.log('🎨 [CART ITEM DEBUG] Item data:', {
    id: item.id,
    productName: item.productName,
    productColor: item.productColor,
    productSize: item.productSize,
    images: item.images,
    hasColor: !!item.productColor,
    hasSize: !!item.productSize,
    fullItem: item
  });

  const handleQuantityChange = (newQuantity) => {
    const maxQuantity = item.availableQuantity || 99; // fallback for guest items
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
      // Always use item.id (cartDetailId for logged-in, 'guest-<pid>' for guests)
      onUpdateQuantity(item.id, newQuantity);
    } else if (newQuantity > maxQuantity) {
      setQuantity(maxQuantity);
      onUpdateQuantity(item.id, maxQuantity);
    }
  };

  return (
    <div className={`flex items-center bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300 ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
      <div className="flex items-center mr-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectItem(item.id, e.target.checked)}
          className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
        />
      </div>
      
      <div className="relative">
        <img
          src={item.images?.[0]?.url ? `http://localhost:8080${item.images[0].url}` : '/no-image.jpg'}
          alt={item.productName}
          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
          onError={(e) => {
            e.target.src = '/no-image.jpg';
          }}
        />
        {/* Badge hiển thị số lượng trong giỏ */}
        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {quantity}
        </div>
      </div>

      <div className="flex-1 ml-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.productName}</h3>
        
        {/* Hiển thị thông tin màu sắc và kích cỡ */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {item.productColor && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Màu:</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200 font-medium">
                {item.productColor}
              </span>
            </div>
          )}
          {item.productSize && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Size:</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 font-medium">
                {item.productSize}
              </span>
            </div>
          )}
        </div>

        {/* Cảnh báo nếu thiếu thông tin */}
        {(!item.productColor || !item.productSize) && (
          <div className="flex items-center space-x-1 mb-2">
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-orange-600">
              Thiếu thông tin chi tiết ({!item.productColor ? 'màu' : ''}{!item.productColor && !item.productSize ? ', ' : ''}{!item.productSize ? 'size' : ''})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium text-indigo-600 mb-1">
              {item.price.toLocaleString('vi-VN')} VND
            </p>
            <p className="text-sm text-gray-500">
              Còn lại: <span className="font-medium text-green-600">
                {item.availableQuantity || 0} sản phẩm
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center mt-4 space-x-2">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
            disabled={quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={item.availableQuantity || 99}
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
            disabled={quantity >= (item.availableQuantity || 99)}
          >
            +
          </button>
          {item.availableQuantity && item.availableQuantity < 10 && (
            <span className="text-xs text-orange-600 ml-2">
              ⚠️ Sắp hết hàng
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => onRemoveItem(item.id)}
        className="text-red-600 hover:text-red-700 font-medium transition duration-200 ml-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default CartItem;