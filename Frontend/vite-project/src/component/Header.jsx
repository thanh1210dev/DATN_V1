import React, { useState, useRef, useEffect } from "react";
import { MdMenu, MdNotificationsNone } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Header({ toggleSidebar }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fullName = localStorage.getItem("name") || "Người dùng";
  const token = localStorage.getItem("token");
  const idUser = localStorage.getItem("id");
  const navigate = useNavigate();
  const menuRef = useRef();
  const [isAdmin, setIsAdmin] = useState(false);

  // Xác định vai trò người dùng từ token
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "ADMIN") {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Token không hợp lệ" + error);
      }
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullName");
    navigate("/login");
  };

  const handleChangeRole = () => {
    navigate("/chon-vai-tro");
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-purple-200">
      <button
        onClick={toggleSidebar}
        className="text-gray-600 hover:text-purple-600 text-2xl"
      >
        <MdMenu />
      </button>

      <div className="flex items-center gap-4 relative" ref={menuRef}>
        <button className="text-gray-600 hover:text-purple-600 text-2xl">
          <MdNotificationsNone />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-gray-800 font-medium">
            {fullName}
          </span>
        </div>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-12 bg-white shadow-lg rounded-md border w-44 z-50">
            {isAdmin && (
              <button
                onClick={handleChangeRole}
                className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50"
              >
                Đổi vai trò
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 border-t"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;