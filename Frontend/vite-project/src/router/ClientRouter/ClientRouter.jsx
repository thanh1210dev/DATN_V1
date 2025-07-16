import React from "react";
import { Routes, Route } from "react-router-dom";
import ClientLayout from "../../component/ClientLayout";
import HomeClient from "../../Pages/Client/HomePage/HomeClient";
import Cart from "../../Pages/Client/CartPage/Cart";
import PrivateRoute from "../../component/PrivateRoute";
import OrderDetail from "../../Pages/Client/OrderPage/OrderDetail";
import LoginPage from "../../Pages/Login/LoginPage";
import RegisterPage from "../../Pages/Login/RegisterPage";
import OAuth2RedirectHandler from "../../Pages/Login/OAuth2RedirectHandler";
import ProductDetail from "../../Pages/Client/ProductDetailPage/ProductDetail";
import Checkout from "../../Pages/Client/CheckoutPage/Checkout";
import Profile from "../../Pages/Client/ProfilePage/Profile";
import ProductList from "../../Pages/Client/ProductPage/ProductList";

const ClientRouter = () => {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomeClient />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/order/:id"
          element={
            <PrivateRoute allowedRoles={["CLIENT"]}>
              <OrderDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={["CLIENT"]}>
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