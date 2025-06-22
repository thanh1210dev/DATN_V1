import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const ProductCard = ({ product }) => {
  const [productDetail, setProductDetail] = useState(null);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/product-details/all/${product.id}?page=0&size=1`);
        const data = await response.json();
        setProductDetail(data.content[0] || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProductDetail();
  }, [product.id]);

  const handleAddToCart = () => {
    if (!productDetail || productDetail.status !== "AVAILABLE") {
      toast.error(
        productDetail?.status === "OUT_OF_STOCK"
          ? "Sản phẩm đã hết hàng!"
          : "Sản phẩm không còn kinh doanh!",
        { position: "top-right", autoClose: 3000 }
      );
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        productDetailId: productDetail?.id,
        productName: product.name,
        price: productDetail?.promotionalPrice || productDetail?.price || 100000,
        quantity: 1,
        size: productDetail?.sizeName,
        color: productDetail?.colorName,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success("Đã thêm vào giỏ hàng!", { position: "top-right", autoClose: 3000 });
  };

  const calculateSavings = () => {
    if (!productDetail?.promotionalPrice || !productDetail?.price) return 0;
    return productDetail.price - productDetail.promotionalPrice;
  };

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition duration-300">
      {/* Badge tiết kiệm */}
      {calculateSavings() > 0 && (
        <div className="absolute top-2 left-2 bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded z-10">
          Tiết kiệm {calculateSavings().toLocaleString("vi-VN")}₫
        </div>
      )}

      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
        <img
          src={
            productDetail?.images?.[0]?.url
              ? `http://localhost:8080${productDetail.images[0].url}`
              : "https://via.placeholder.com/300?text=Không+có+ảnh"
          }
          alt={product.name}
          className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Nút Thêm nhanh */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleAddToCart();
          }}
          className="absolute bottom-3 right-3 bg-white text-gray-800 px-3 py-1 text-xs font-semibold rounded shadow-md opacity-0 group-hover:opacity-100 transition duration-300"
        >
          + Thêm nhanh
        </button>
      </Link>

      {/* Tên và giá */}
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{product.name}</h3>
        </Link>
        <div className="flex gap-2 mt-2 items-center">
          {productDetail?.promotionalPrice ? (
            <>
              <span className="text-indigo-600 font-semibold text-[15px]">
                {productDetail.promotionalPrice.toLocaleString("vi-VN")}₫
              </span>
              <span className="line-through text-gray-400 text-sm">
                {productDetail.price.toLocaleString("vi-VN")}₫
              </span>
            </>
          ) : (
            <span className="text-indigo-600 font-semibold text-[15px]">
              {(productDetail?.price || 100000).toLocaleString("vi-VN")}₫
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
