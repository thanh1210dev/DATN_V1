import React, { useState } from "react";
import { toast } from "react-toastify";

const ProductInfo = ({ product, productDetail, productDetails, setSelectedDetail }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.productDetailId === productDetail.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        productDetailId: productDetail.id,
        productName: productDetail.productName,
        price: productDetail.promotionalPrice || productDetail.price || 100000,
        quantity,
        size: productDetail.sizeName,
        color: productDetail.colorName,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success("Đã thêm vào giỏ hàng!", { position: "top-right", autoClose: 3000 });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{productDetail.productName}</h1>
      <p className="text-lg text-indigo-600 font-semibold mb-4">
        {productDetail.promotionalPrice || productDetail.price || 100000} VND
      </p>
      <p className="text-gray-600 mb-4">{product.description || "Mô tả sản phẩm không có sẵn"}</p>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">Màu sắc:</label>
        <select
          value={productDetail.id}
          onChange={(e) => {
            const detail = productDetails.find((d) => d.id === parseInt(e.target.value));
            setSelectedDetail(detail);
          }}
          className="px-4 py-2 border border-indigo-200 rounded-lg text-sm"
        >
          {productDetails.map((detail) => (
            <option key={detail.id} value={detail.id}>
              {detail.colorName}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">Kích cỡ:</label>
        <span>{productDetail.sizeName}</span>
      </div>
      <div className="flex items-center mb-4">
        <label className="text-sm font-medium text-gray-700 mr-2">Số lượng:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-16 px-2 py-1 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        onClick={handleAddToCart}
        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
      >
        Thêm vào giỏ hàng
      </button>
    </div>
  );
};

export default ProductInfo;