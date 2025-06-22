import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import AuthService from "../Service/AuthService";

const ClientLayout = () => {
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <nav className="bg-white shadow-lg sticky top-0 z-50 w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-3xl font-extrabold text-purple-700 tracking-tight transition-transform duration-300 hover:scale-105">
              Polo Viet
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-purple-700 bg-purple-100"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`
                }
                style={{ textDecoration: "none" }}
              >
                Trang Chủ
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-purple-700 bg-purple-100"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`
                }
                style={{ textDecoration: "none" }}
              >
                Sản Phẩm
              </NavLink>
              <NavLink
                to="/best-sellers"
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-purple-700 bg-purple-100"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`
                }
                style={{ textDecoration: "none" }}
              >
                Sản Phẩm Bán Chạy
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-purple-700 bg-purple-100"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`
                }
                style={{ textDecoration: "none" }}
              >
                Liên Hệ
              </NavLink>
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-1 ${
                    isActive
                      ? "text-purple-700 bg-purple-100"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`
                }
                style={{ textDecoration: "none" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Giỏ Hàng</span>
              </NavLink>
              {user ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "text-purple-700 bg-purple-100"
                          : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      }`
                    }
                    style={{ textDecoration: "none" }}
                  >
                    Cá Nhân
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                  >
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md ${
                      isActive
                        ? "bg-purple-700 text-white"
                        : "bg-purple-600 text-white hover:bg-purple-800"
                    }`
                  }
                  style={{ textDecoration: "none" }}
                >
                  Đăng Nhập
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <footer className="bg-purple-900 text-white py-12 w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-purple-200 mb-4">Polo Viet</h2>
              <p className="text-sm text-purple-100 mb-4">
                Cung cấp sản phẩm chất lượng cao, mang phong cách Việt hiện đại.
              </p>
              <div className="w-24 h-12 bg-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-medium">Logo</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Liên Kết Nhanh</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <NavLink
                    to="/"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Trang Chủ
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/products"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Sản Phẩm
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/best-sellers"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Sản Phẩm Bán Chạy
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/contact"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Liên Hệ
                  </NavLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Dịch Vụ Khách Hàng</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@poloviet.com"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    support@poloviet.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+84234567890"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    +84 234 567 890
                  </a>
                </li>
                <li>
                  <p className="text-purple-100">123 Đường Việt, TP.HCM, Việt Nam</p>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Theo Dõi Chúng Tôi</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-purple-100 hover:text-white transition-colors duration-300"
                    style={{ textDecoration: "none" }}
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-purple-700 text-center">
            <p className="text-sm text-purple-100">© 2025 Polo Viet. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;