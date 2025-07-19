import React, { useState } from 'react';
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
  const [quantity, setQuantity] = useState(1);

  const calculateSavings = () => {
    if (!productDetail?.promotionalPrice || !productDetail?.price) return 0;
    return productDetail.price - productDetail.promotionalPrice;
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleBuyNow = () => {
    // Xử lý mua ngay
    toast.info('Tính năng mua ngay đang được phát triển', { position: 'top-right', autoClose: 3000 });
  };

  const handleViewStore = () => {
    // Xử lý xem địa chỉ cửa hàng
    toast.info('Tính năng xem địa chỉ cửa hàng đang được phát triển', { position: 'top-right', autoClose: 3000 });
  };

  return (
    <div className="space-y-6">
      {/* Tên sản phẩm */}
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Giá sản phẩm */}
      <div className="flex items-center gap-4">
        {productDetail?.promotionalPrice ? (
          <>
            <span className="text-3xl font-bold text-red-600">
              {productDetail.promotionalPrice.toLocaleString('vi-VN')}₫
            </span>
            <span className="text-xl line-through text-gray-400">
              {productDetail.price.toLocaleString('vi-VN')}₫
            </span>
            {calculateSavings() > 0 && (
              <span className="text-sm text-green-600 font-medium">
                Tiết kiệm {calculateSavings().toLocaleString('vi-VN')}₫
              </span>
            )}
          </>
        ) : (
          <span className="text-3xl font-bold text-red-600">
            {(productDetail?.price || 100000).toLocaleString('vi-VN')}₫
          </span>
        )}
      </div>

      {/* Chọn kích cỡ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Kích cỡ: {selectedSizeId ? sizes.find(s => s.id === selectedSizeId)?.name : 'Chưa chọn'}</label>
          <button className="text-sm text-blue-600 hover:text-blue-800 underline">
            Hướng dẫn chọn kích cỡ
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sizes.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => setSelectedSizeId(size.id)}
              className={`px-4 py-2 rounded border-2 text-sm font-medium transition-all duration-200 ${
                selectedSizeId === size.id 
                  ? 'border-black bg-black text-white' 
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chọn màu sắc */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Màu sắc:</label>
          <div className="flex gap-3 flex-wrap">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColorId(color.id)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  selectedColorId === color.id 
                    ? 'border-black ring-2 ring-gray-300' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.code || '#fff' }}
                disabled={!selectedSizeId}
                title={color.name}
              >
                {selectedColorId === color.id && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Thông tin sản phẩm */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          {product.brandName && (
            <span className="px-3 py-1 bg-orange-100 text-gray-700 rounded-full font-medium font-bold">
              Thương hiệu: {product.brandName}
            </span>
          )}
          {product.materialName && (
            <span className="px-3 py-1 bg-blue-100 text-gray-700 rounded-full font-medium font-bold">
              Chất liệu: {product.materialName}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-700 leading-relaxed">
          <strong>Mô tả:</strong> {product.description || 'Sản phẩm chất lượng cao với thiết kế hiện đại, phù hợp với nhiều phong cách thời trang.'}
        </div>
      </div>

      {/* Chọn số lượng */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Số lượng:</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-16 h-8 border border-gray-300 rounded text-center text-sm"
            min="1"
          />
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Các nút hành động */}
      <div className="space-y-3">
        <button
          onClick={onAddToCart}
          className="w-full px-6 py-3 border-2 border-red-600 bg-white text-red-600 font-semibold rounded hover:bg-red-50 transition duration-300"
          disabled={!productDetail || productDetail.status !== 'AVAILABLE'}
        >
          THÊM VÀO GIỎ
        </button>
        <button
          onClick={handleBuyNow}
          className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition duration-300"
          disabled={!productDetail || productDetail.status !== 'AVAILABLE'}
        >
          MUA NGAY
        </button>
        <button
          onClick={handleViewStore}
          className="w-full px-6 py-3 bg-black text-white font-semibold rounded hover:bg-gray-800 transition duration-300"
        >
          XEM ĐỊA CHỈ CỬA HÀNG
        </button>
      </div>

      {/* Thông tin bổ sung */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
          </svg>
          <span>Miễn phí giao hàng cho đơn hàng từ 299k.</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Mua hàng tích điểm thành viên.</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;