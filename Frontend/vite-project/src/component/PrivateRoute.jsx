import React from "react";
import { Navigate } from "react-router-dom";
import { getRoleFromToken } from "../utils/auth";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = token ? getRoleFromToken(token) : null;

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />; // Chuyển hướng về HomeClient nếu không có quyền
  }

  return children;
};

export default PrivateRoute;