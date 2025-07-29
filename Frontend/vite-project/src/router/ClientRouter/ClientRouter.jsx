import React from "react";
import { Routes, Route } from "react-router-dom";
import ClientLayout from "../../component/ClientLayout";
import HomeClient from "../../Pages/Client/HomePage/HomeClient";
import Cart from "../../Pages/Client/CartPage/Cart";
import CartDebug from "../../Pages/Client/CartPage/CartDebug";
import PrivateRoute from "../../component/PrivateRoute";
import OrderDetail from "../../Pages/Client/MyOrdersPage/OrderDetail";
import MyOrders from "../../Pages/Client/MyOrdersPage/MyOrders";
import LoginPage from "../../Pages/Login/LoginPage";
import RegisterPage from "../../Pages/Login/RegisterPage";
import OAuth2RedirectHandler from "../../Pages/Login/OAuth2RedirectHandler";
import ProductDetail from "../../Pages/Client/ProductDetailPage/ProductDetail";
import Checkout from "../../Pages/Client/CheckoutPage/Checkout";
import Profile from "../../Pages/Client/ProfilePage/Profile";
import ProductList from "../../Pages/Client/ProductPage/ProductList";
import PaymentResult from "../../Pages/Client/PaymentResult/PaymentResult";

const ClientRouter = () => {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomeClient />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/cart-debug" element={<CartDebug />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route
          path="/my-orders"
          element={
            <PrivateRoute allowedRoles={["CLIENT", "ADMIN"]}>
              <MyOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/order/:orderId"
          element={
            <PrivateRoute allowedRoles={["CLIENT", "ADMIN"]}>
              <OrderDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={["CLIENT", "ADMIN"]}>
              <Profile />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
      <Route path="*" element={<div className="p-6 text-center text-gray-500 font-sans text-lg">404 - Không tìm thấy trang</div>} />
    </Routes>
  );
};

export default ClientRouter;