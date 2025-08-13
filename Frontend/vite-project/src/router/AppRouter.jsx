import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../component/PrivateRoute";
import SideBar from "../component/SideBar";
import Header from "../component/Header";
import GoogleOAuth2RedirectHandler from "../Pages/google/GoogleOAuth2RedirectHandler";

import AdminQuanlyGiamGia from "./AdminRouter/AdminQuanlyGiamGia";
import AdminQuanLySanPham from "./AdminRouter/AdminQuanLySanPham";
import ClientRouter from "./ClientRouTer/ClientRouter";
import AdminQuanLyThongKe from "./AdminRouter/AdminQuanLyThongKe";
import AdminQuanLyHoaDon from "./AdminRouter/AdminQuanLyHoaDon";



const AppRouter = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Routes>
      {/* OAuth2 Redirect (must be explicit to capture token before client wildcard) */}
      <Route path="/oauth2/redirect" element={<GoogleOAuth2RedirectHandler />} />
      {/* Client Routes */}
      <Route path="/*" element={<ClientRouter />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={["STAFF", "ADMIN"]}>
            <div className="flex h-screen overflow-hidden bg-gray-100">
              <div className={`transition-all duration-300 ${isOpen ? "w-80" : "w-16"}`}>
                <SideBar isOpen={isOpen} toggleSidebar={toggleSidebar} />
              </div>
              <div className="flex-1 flex flex-col">
                <Header toggleSidebar={toggleSidebar} />
                <main className="p-6 flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<div className="text-2xl font-bold text-indigo-700">Trang Quản Lý Admin</div>} />
                    {AdminQuanlyGiamGia}
                    {AdminQuanLySanPham}
                    {AdminQuanLyThongKe}
                    {AdminQuanLyHoaDon}
                   
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