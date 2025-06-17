import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const ProductCard = ({ product }) => {
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        price: 100000, // Hardcode giá
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success("Đã thêm vào giỏ hàng!", { position: "top-right", autoClose: 3000 });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition">
      <Link to={`/products/${product.id}`}>
        <img
          src="https://via.placeholder.com/300"
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
        </Link>
        <p className="text-indigo-600 font-semibold mt-1">100000 VND</p>
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
};

export default ProductCard;