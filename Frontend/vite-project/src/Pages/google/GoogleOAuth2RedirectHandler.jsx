import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getRoleFromToken } from "../../utils/auth";

const GoogleOAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPathByRole = (role) => {
    switch (role) {
      case "ADMIN":
        return "/chon-vai-tro";
      case "TRUONG_PHONG_PR":
        return "/";
      case "GIANG_VIEN":
        return "/dang-ky-viet-bai";
      case "NHAN_VIEN_PR":
        return "/danh-sach-bai-viet";
      default:
        return "/";
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    const fullName = query.get("fullName");

    if (token) {
      localStorage.setItem("token", token);
      if (fullName) {
        localStorage.setItem("fullName", fullName);
      }

      const role = getRoleFromToken(token);
      const redirectPath = getRedirectPathByRole(role);
      toast.success("Đăng nhập Google thành công!");
      navigate(redirectPath);
    } else {
      toast.error("Lỗi khi đăng nhập bằng Google");
      navigate("/login");
    }
  }, [location, navigate]);

  return <div>Đang xử lý đăng nhập bằng Google...</div>;
};

export default GoogleOAuth2RedirectHandler;
