import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
  }, []);

  const handleUpdateQuantity = (productDetailId, quantity) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const item = cart.find((item) => item.productDetailId === productDetailId);
    if (item) {
      item.quantity = quantity;
      localStorage.setItem("cart", JSON.stringify(cart));
      setCartItems([...cart]);
    }
  };

  const handleRemoveItem = (productDetailId) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = cart.filter((item) => item.productDetailId !== productDetailId);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng", { position: "top-right", autoClose: 3000 });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6">Giỏ Hàng</h1>
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500">Giỏ hàng trống</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {cartItems.map((item) => (
                <CartItem
                  key={item.productDetailId}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
            <CartSummary cartItems={cartItems} />
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Link
            to="/checkout"
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
          >
            Tiến hành thanh toán
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;