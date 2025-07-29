import axiosInstance from '../Service/axiosInstance';

// Cache để lưu mapping email -> userId
const userIdCache = new Map();

/**
 * Lấy user info từ JWT token (fallback to localStorage)
 * @returns {Promise<{id: number, email: string, role: string}>} userInfo
 */
export const getCurrentUserInfo = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    // Thử parse từ token trước
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 [getCurrentUserInfo] Token payload:', tokenPayload);
      
      const userInfo = {
        id: tokenPayload.userId || tokenPayload.id || parseInt(localStorage.getItem('id')),
        email: tokenPayload.sub || localStorage.getItem('email'),
        role: tokenPayload.role || localStorage.getItem('selectedRole')
      };
      
      console.log('🔍 [getCurrentUserInfo] Parsed from token:', userInfo);
      return userInfo;
    } catch (parseError) {
      console.warn('Cannot parse token, falling back to localStorage');
    }

    // Fallback: lấy từ localStorage
    const userInfo = {
      id: parseInt(localStorage.getItem('id')),
      email: localStorage.getItem('email') || 'unknown@email.com',
      role: localStorage.getItem('selectedRole') || 'CLIENT'
    };
    
    console.log('🔍 [getCurrentUserInfo] From localStorage:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Error getting current user info:', error);
    
    // Nếu token không hợp lệ, clear localStorage và redirect
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('selectedRole');
    
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
    throw new Error('Cannot get current user info');
  }
};

/**
 * Lấy user ID số từ email (sử dụng JWT token)
 * @param {string} email 
 * @returns {Promise<number>} userId
 */
export const getUserIdByEmail = async (email) => {
  // Kiểm tra cache trước
  if (userIdCache.has(email)) {
    return userIdCache.get(email);
  }

  try {
    // Thử lấy từ JWT token trước
    const userInfo = await getCurrentUserInfo();
    if (userInfo.email === email) {
      userIdCache.set(email, userInfo.id);
      return userInfo.id;
    }

    // Nếu email không khớp với user hiện tại, thử API search
    const endpoints = [
      `/users/by-email/${encodeURIComponent(email)}`,
      `/api/users/email/${encodeURIComponent(email)}`,
      `/users/email/${encodeURIComponent(email)}`,
      `/api/user/by-email?email=${encodeURIComponent(email)}`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axiosInstance.get(endpoint);
        if (response.data && (response.data.id || response.data.idUser)) {
          const userId = response.data.id || response.data.idUser;
          userIdCache.set(email, userId); // Cache kết quả
          return userId;
        }
      } catch (error) {
        console.log(`Failed to get user ID from ${endpoint}:`, error.message);
        continue;
      }
    }

    // Nếu không có API nào work, trả về lỗi rõ ràng
    throw new Error(`Cannot find user ID for email: ${email}`);
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    throw error;
  }
};

/**
 * Lấy user ID hiện tại từ JWT token (wrapper function tiện lợi)
 * @returns {Promise<number>} userId
 */
export const getCurrentUserId = async () => {
  try {
    const userInfo = await getCurrentUserInfo();
    return userInfo.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    throw error;
  }
};

/**
 * Clear cache khi logout
 */
export const clearUserIdCache = () => {
  userIdCache.clear();
};
