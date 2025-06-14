import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import SideBar from "../component/SideBar";
import Header from "../component/Header";
import PrivateRoute from "../component/PrivateRoute";

import LoginPage from "../Pages/Login/LoginPage";
import RegisterPage from "../Pages/Login/RegisterPage";
import OAuth2RedirectHandler from "../Pages/Login/OAuth2RedirectHandler";
import HomeClient from "../Pages/Client/Home/HomeClient";
import AdminQuanlyGiamGia from "./AdminRouter/AdminQuanlyGiamGia";
import AdminQuanLySanPham from "./AdminRouter/AdminQuanLySanPham";

const AppRouter = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Routes>
       <Route path="/" element={<HomeClient />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
     

      <Route
        path="*"
        element={
          <PrivateRoute allowedRoles={["STAFF", "ADMIN"]}>
            <div className="flex h-screen overflow-hidden">
              <div className={`transition-all duration-300 ${isOpen ? "w-80" : "w-0"}`}>
                <SideBar isOpen={isOpen} toggleSidebar={toggleSidebar} />
              </div>
              <div className="flex-1 flex flex-col">
                <Header toggleSidebar={toggleSidebar} />
                <main className="p-6 flex-1 overflow-auto">
                  <Routes>
                  <Route path="/" element={<div>Trang Quản Lý Admin</div>} />

                     {AdminQuanlyGiamGia}
                    {AdminQuanLySanPham}
                    
                  </Routes>
                </main>
              </div>
            </div>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default AppRouter;