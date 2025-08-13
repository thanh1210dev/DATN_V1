import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MdMenu, MdNotificationsNone } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Header({ toggleSidebar }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fullName = localStorage.getItem("fullName") || localStorage.getItem("name") || "Người dùng";
  const token = localStorage.getItem("token");
  const idUser = localStorage.getItem("id");
  const navigate = useNavigate();
  const menuRef = useRef();
  const [userRole, setUserRole] = useState(null);

  // Xác định vai trò người dùng từ token
  useEffect(() => {
    if (token) {
      try {
  const decoded = jwtDecode(token);
  const role = (decoded.role || decoded.authorities?.[0] || decoded.roles?.[0] || '').replace(/^ROLE_/,'');
  setUserRole(role);
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

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);

  const openForgot = () => {
    setIsMenuOpen(false);
    setShowForgot(true);
    setForgotEmail("");
    setForgotDone(false);
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await axios.post("http://localhost:8080/api/user/forgot-password", { email: forgotEmail });
      setForgotDone(true);
      toast.success("Vui lòng kiểm tra email để đặt lại mật khẩu");
    } catch (err) {
      const msg = err?.response?.data || "Không thể yêu cầu đặt lại mật khẩu";
      toast.error(typeof msg === "string" ? msg : "Không thể yêu cầu đặt lại mật khẩu");
    } finally {
      setForgotLoading(false);
    }
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
            {(userRole === 'ADMIN' || userRole === 'STAFF') && (
              <button
                onClick={openForgot}
                className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50"
              >
                Quên mật khẩu
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
      {showForgot && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >✕</button>
            <h2 className="text-xl font-semibold mb-2">Quên mật khẩu</h2>
            <p className="text-gray-500 text-sm mb-4">Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
            {forgotDone ? (
              <div className="text-green-700 bg-green-50 p-3 rounded text-sm">Đã gửi email nếu email tồn tại trong hệ thống.</div>
            ) : (
              <form onSubmit={submitForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {forgotLoading ? "Đang gửi..." : "Gửi liên kết"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </header>
  );
}

export default Header;