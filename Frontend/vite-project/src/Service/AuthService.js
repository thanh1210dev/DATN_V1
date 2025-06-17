import { getRoleFromToken } from "../utils/auth";


const AuthService = {
  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    const id = localStorage.getItem("id");
    const role = localStorage.getItem("selectedRole") || (token ? getRoleFromToken(token) : null);
    if (token && role) {
      return { id, name, role };
    }
    return null;
  },
  login: async (identifier, password) => {
    const response = await fetch("http://localhost:8080/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Đăng nhập thất bại");
    localStorage.setItem("token", data.token);
    localStorage.setItem("name", data.name);
    localStorage.setItem("id", data.id);
    localStorage.setItem("selectedRole", data.role);
    return data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("id");
    localStorage.removeItem("selectedRole");
    localStorage.removeItem("cart");
    localStorage.removeItem("orders");
  },
};

export default AuthService;