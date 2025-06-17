import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

import OrderSummary from "../OrderPage/OrderSummary";
import ShippingForm from "./ShippingForm";
import PaymentMethod from "./PaymentMethod";


const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [shippingInfo, setShippingInfo] = useState({ name: "", address: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);
  }, []);

  const handlePlaceOrder = () => {
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.phone) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng", { position: "top-right", autoClose: 3000 });
      return;
    }
    const order = {
      id: Date.now(),
      shippingInfo,
      paymentMethod,
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
      status: "PENDING",
    };
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    localStorage.removeItem("cart");
    toast.success("Đặt hàng thành công!", { position: "top-right", autoClose: 3000 });
    navigate(`/order/${order.id}`);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ShippingForm shippingInfo={shippingInfo} setShippingInfo={setShippingInfo} />
          <PaymentMethod paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
        </div>
        <OrderSummary cartItems={cartItems} onPlaceOrder={handlePlaceOrder} />
      </div>
    </div>
  );
};

export default Checkout;