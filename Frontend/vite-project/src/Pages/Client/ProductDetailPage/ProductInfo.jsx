import React from 'react';
import { toast } from 'react-toastify';

const ProductInfo = ({
  product,
  productDetail,
  sizes,
  colors,
  selectedSizeId,
  setSelectedSizeId,
  selectedColorId,
  setSelectedColorId,
  onAddToCart,
}) => {
  const calculateSavings = () => {
    if (!productDetail?.promotionalPrice || !productDetail?.price) return 0;
    return productDetail.price - productDetail.promotionalPrice;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
      <div className="flex items-center gap-4">
        {productDetail?.promotionalPrice ? (
          <>
            <span className="text-2xl font-semibold text-indigo-600">
              {productDetail.promotionalPrice.toLocaleString('vi-VN')} VND
            </span>
            <span className="text-lg line-through text-gray-400">
              {productDetail.price.toLocaleString('vi-VN')} VND
            </span>
            {calculateSavings() > 0 && (
              <span className="text-sm text-green-600">
                Tiết kiệm {calculateSavings().toLocaleString('vi-VN')} VND
              </span>
            )}
          </>
        ) : (
          <span className="text-2xl font-semibold text-indigo-600">
            {(productDetail?.price || 100000).toLocaleString('vi-VN')} VND
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">Trọng lượng: {productDetail?.weight ? `${productDetail.weight}g` : 'Chưa xác định'}</p>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kích cỡ</label>
        <select
          value={selectedSizeId}
          onChange={(e) => setSelectedSizeId(e.target.value)}
          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Chọn kích cỡ</option>
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Màu sắc</label>
        <select
          value={selectedColorId}
          onChange={(e) => setSelectedColorId(e.target.value)}
          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={!selectedSizeId}
        >
          <option value="">Chọn màu sắc</option>
          {colors.map((color) => (
            <option key={color.id} value={color.id}>
              {color.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onAddToCart}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
        disabled={!productDetail || productDetail.status !== 'AVAILABLE'}
      >
        Thêm vào giỏ hàng
      </button>
    </div>
  );
};

export default ProductInfo;