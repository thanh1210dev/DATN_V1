import { getRoleFromToken } from "../utils/auth";
import { clearUserIdCache } from "../utils/userUtils";


const AuthService = {
  getCurrentUser: () => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    let id = localStorage.getItem("id");
    const role = localStorage.getItem("selectedRole") || (token ? getRoleFromToken(token) : null);
    
    // Nếu không có ID trong localStorage, thử lấy từ token
    if (!id && token) {
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    
        
        // Ưu tiên lấy User ID số trước từ token
        id = tokenPayload.userId || tokenPayload.id || tokenPayload.accountId || tokenPayload.user_id;
        
        // Lưu email từ token nếu chưa có trong localStorage
        const emailFromToken = tokenPayload.sub;
        if (emailFromToken && !localStorage.getItem("email")) {
          localStorage.setItem("email", emailFromToken);
        }
        
        // Nếu không có userId trong token, thì dùng email (fallback)
        if (!id) {
          id = tokenPayload.sub;
        }
        

        if (id) {
          localStorage.setItem("id", id); // Lưu lại để lần sau không cần decode token
        }
      } catch (error) {

      }
    }
    

    
    if (token && role && id) {
      const user = { id, name, role };
      return user;
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
    
    // Thử các khả năng khác nhau cho user ID
    const userId = data.idUser || data.id || data.userId || data.user_id || data.accountId;

    
    localStorage.setItem("token", data.token);
    localStorage.setItem("name", data.name);
    localStorage.setItem("id", userId);
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
    clearUserIdCache(); // Clear user ID cache khi logout
  },

  // Get user info from backend API using token
  getCurrentUserFromAPI: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return null;
      }

      const response = await fetch("http://localhost:8080/api/user/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const userData = await response.json();

        
        // Update localStorage with correct data
        if (userData.id) {
          localStorage.setItem("id", userData.id);
        }
        
        return {
          id: userData.id,
          email: userData.email,
          role: userData.role
        };
      } else {
        console.error('Failed to get user info from API');
        return null;
      }
    } catch (error) {
      console.error('Error getting user info from API:', error);
      return null;
    }
  }
};

export default AuthService;