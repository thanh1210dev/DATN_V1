import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getRoleFromToken } from "../utils/auth";

const PrivateRoute = ({ children, allowedRoles }) => {
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    const r = getRoleFromToken(token);
    setRole(r);
    setChecked(true);
    if (!r) {
      // debug log to help detect format issues
      try { console.warn("Token decoded but no role claim", JSON.parse(atob(token.split('.')[1]))); } catch(e) { console.warn('Cannot parse token payload'); }
    }
  }, [token]);

  if (!checked) {
    return <div className="w-full h-screen flex items-center justify-center text-gray-500 text-sm">Đang tải...</div>;
  }

  if (!token) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }
  return children;
};

export default PrivateRoute;