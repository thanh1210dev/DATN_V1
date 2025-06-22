import React, { useState } from "react";
import { toast } from "react-toastify";

const ProductInfo = ({ product, productDetail, sizes, colors, selectedSizeId, setSelectedSizeId, selectedColorId, setSelectedColorId }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!productDetail) {
      toast.error("Vui lòng chọn kích thước và màu sắc!", { position: "top-right", autoClose: 3000 });
      return;
    }
    if (productDetail.status !== "AVAILABLE") {
      toast.error(productDetail.status === "OUT_OF_STOCK" ? "Sản phẩm đã hết hàng!" : "Sản phẩm không còn kinh doanh!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
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

  const getStatusText = (status) => {
    switch (status) {
      case "AVAILABLE":
        return { text: "Còn hàng", color: "text-green-600" };
      case "OUT_OF_STOCK":
        return { text: "Hết hàng", color: "text-red-600" };
      case "DISCONTINUED":
        return { text: "Ngừng bán", color: "text-gray-600" };
      default:
        return { text: "", color: "" };
    }
  };

  const status = getStatusText(productDetail?.status);

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-gray-800">{productDetail?.productName || product.name}</h1>
      <div className="flex items-center gap-3">
        {productDetail?.promotionalPrice ? (
          <>
            <p className="text-2xl text-indigo-600 font-semibold">{productDetail.promotionalPrice.toLocaleString('vi-VN')} VND</p>
            <p className="text-lg text-gray-400 line-through">{productDetail.price.toLocaleString('vi-VN')} VND</p>
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Sale</span>
          </>
        ) : (
          <p className="text-2xl text-indigo-600 font-semibold">{(productDetail?.price || 100000).toLocaleString('vi-VN')} VND</p>
        )}
      </div>
      {status.text && (
        <p className={`text-sm font-medium ${status.color}`}>{status.text}</p>
      )}
      <p className="text-gray-600 text-base leading-relaxed">{product.description || "Mô tả sản phẩm không có sẵn"}</p>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Kích thước:</label>
        <select
          value={selectedSizeId}
          onChange={(e) => setSelectedSizeId(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Chọn kích thước</option>
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Màu sắc:</label>
        <select
          value={selectedColorId}
          onChange={(e) => setSelectedColorId(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Số lượng:</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={productDetail?.status !== "AVAILABLE"}
        />
      </div>
      <button
        onClick={handleAddToCart}
        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md"
        disabled={productDetail?.status !== "AVAILABLE"}
      >
        Thêm vào giỏ hàng
      </button>
    </div>
  );
};

export default ProductInfo;