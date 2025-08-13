import React, { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import AuthService from "../Service/AuthService";

const ClientLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const userMenuRef = useRef(null);
  const searchModalRef = useRef(null);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  // Đóng dropdown user khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  // Đóng modal search khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (showSearch && searchModalRef.current && !searchModalRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    }
    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);

  // Xử lý logout
  const handleLogout = () => {
    AuthService.logout();
    window.location.href = "/login";
  };

  // Xử lý search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/products?name=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate(`/products`);
    }
    setShowSearch(false);
    setSearchValue("");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <nav className="bg-white shadow-lg sticky top-0 z-50 w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 relative max-w-7xl mx-auto mt-2">
            {/* Logo bên trái */}
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-extrabold text-purple-700 tracking-tight transition-transform duration-300 hover:scale-105">
               Polo Viet
              </h1>
            </div>
            {/* Menu căn giữa (ẩn trên mobile) */}
            <div className="hidden md:flex flex-1 justify-center space-x-4">
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
              {/* Guest flow is integrated; no separate link needed */}
            </div>
            {/* 3 icon bên phải */}
            <div className="flex items-center space-x-4">
              {/* Quick link: Tra cứu đơn (right side) */}
              <NavLink
                to="/order-lookup"
                className={({ isActive }) =>
                  `hidden sm:inline px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive ? "text-purple-700 bg-purple-100" : "text-purple-700 hover:bg-purple-50"
                  }`
                }
                style={{ textDecoration: "none" }}
                aria-label="Tra cứu đơn hàng"
              >
                Tra Cứu Đơn
              </NavLink>
              {/* Search icon */}
              <button
                className="p-2 rounded hover:bg-purple-50 transition"
                onClick={() => setShowSearch(true)}
                aria-label="Tìm kiếm"
              >
                <svg className="h-6 w-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-2-2"/></svg>
              </button>
              {/* User icon + dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  className="p-2 mt-2 rounded hover:bg-purple-50 transition flex items-center justify-center"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Tài khoản"
                >
                  <svg className="h-6 w-6 text-purple-700 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg z-50 py-2 animate-fade-in">
                    {user ? (
                      <>
                        <NavLink to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-purple-50" onClick={() => setUserMenuOpen(false)}>Cá Nhân</NavLink>
                        <NavLink to="/my-orders" className="block px-4 py-2 text-gray-700 hover:bg-purple-50" onClick={() => setUserMenuOpen(false)}>Đơn hàng của tôi</NavLink>
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50">Đăng Xuất</button>
                      </>
                    ) : (
                      <>
                        <NavLink to="/login" className="block px-4 py-2 text-gray-700 hover:bg-purple-50" onClick={() => setUserMenuOpen(false)}>Đăng Nhập</NavLink>
                        <NavLink to="/register" className="block px-4 py-2 text-gray-700 hover:bg-purple-50" onClick={() => setUserMenuOpen(false)}>Đăng Ký</NavLink>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Cart icon chỉ là icon */}
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `p-2 rounded hover:bg-purple-50 transition flex items-center justify-center ${
                    isActive ? "bg-purple-100" : ""
                  }`
                }
                aria-label="Giỏ hàng"
                style={{ textDecoration: "none" }}
              >
                <svg className="h-6 w-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              </NavLink>
              {/* Hamburger menu cho mobile */}
              <button
                className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <svg
                  className="h-6 w-6 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
          {/* Menu mobile xổ xuống */}
          {menuOpen && (
            <div className="flex flex-col space-y-2 mt-2 md:hidden">
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
                onClick={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
              >
                Sản Phẩm
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
                onClick={() => setMenuOpen(false)}
              >
                Liên Hệ
              </NavLink>
              {/* Guest flow is integrated; no separate link needed in mobile */}
              {user && (
                <NavLink
                  to="/my-orders"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "text-purple-700 bg-purple-100"
                        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    }`
                  }
                  style={{ textDecoration: "none" }}
                  onClick={() => setMenuOpen(false)}
                >
                  Đơn hàng của tôi
                </NavLink>
              )}
            </div>
          )}
        </div>
      </nav>
      {/* Overlay search modal đúng layout: logo | input search | icon search, không có icon khác, click ra ngoài là đóng, animation slide-down */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm">
          <div
            ref={searchModalRef}
            className="w-full max-w-2xl mx-auto mt-8 bg-white rounded-full shadow-lg px-8 py-3 flex items-center gap-4 border border-gray-300 animate-slide-down"
            style={{ minHeight: 56 }}
          >
            {/* Logo bên trái */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-extrabold text-purple-700">Polo Viet</h1>
            </div>
            {/* Thanh search ở giữa */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center">
              <input
                autoFocus
                type="text"
                className="flex-1 px-4 py-2 outline-none bg-transparent text-lg"
                placeholder="Tìm theo tên sản phẩm..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
              <button type="submit" className="ml-2 p-2 rounded-full hover:bg-purple-50 transition" aria-label="Tìm kiếm">
                <svg className="h-6 w-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-2-2"/></svg>
              </button>
            </form>
          </div>
        </div>
      )}
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