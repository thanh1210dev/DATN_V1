import axiosInstance from '../Service/axiosInstance';
import { jwtDecode } from 'jwt-decode';

// Cache để lưu mapping email -> userId
const userIdCache = new Map();

/**
 * Lấy user ID số từ email hoặc JWT token
 * @param {string} email 
 * @returns {Promise<number>} userId
 */
export const getUserIdByEmail = async (email) => {
  // Kiểm tra cache trước
  if (userIdCache.has(email)) {
    console.log('✅ [USER UTILS] Got userId from cache:', userIdCache.get(email));
    return userIdCache.get(email);
  }

  try {
    // 1. Thử extract từ JWT token trước (efficient nhất)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('🔍 [USER UTILS] Decoded token:', decoded);
        console.log('🔍 [USER UTILS] Checking email match:', decoded.sub, 'vs', email);
        
        // Kiểm tra nếu email trong token khớp với email yêu cầu
        if (decoded.sub === email && decoded.userId) {
          const userId = decoded.userId;
          userIdCache.set(email, userId);
          console.log('✅ [USER UTILS] Got userId from token:', userId);
          return userId;
        } else {
          console.log('🔍 [USER UTILS] Email mismatch or no userId in token');
        }
      } catch (jwtError) {
        console.log('🔍 [USER UTILS] Failed to decode JWT:', jwtError.message);
      }
    } else {
      console.log('🔍 [USER UTILS] No token found');
    }

    // 2. Thử các endpoint API
    console.log('🔍 [USER UTILS] Trying API endpoints for email:', email);
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
          console.log('✅ [USER UTILS] Got userId from API:', userId);
          return userId;
        }
      } catch (error) {
        console.log(`Failed to get user ID from ${endpoint}:`, error.message);
        continue;
      }
    }

    // 3. Mapping cứng backup (temporary)
    console.log('🔍 [USER UTILS] Trying hardcoded mapping for:', email);
    const hardcodedMapping = {
      'proanuong1@gmail.com': 1,
      'thanh1210.dev@gmail.com': 3,  // ✅ Sửa từ 2 thành 3 theo database
      'admin@example.com': 1,
      'user@example.com': 2
    };

    if (hardcodedMapping[email]) {
      const userId = hardcodedMapping[email];
      userIdCache.set(email, userId);
      console.log('✅ [USER UTILS] Got userId from hardcoded mapping:', userId);
      return userId;
    }

    console.log('❌ [USER UTILS] Cannot get user ID from email:', email);
    throw new Error('Cannot get user ID from email');
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    throw error;
  }
};

/**
 * Clear cache khi logout
 */
export const clearUserIdCache = () => {
  userIdCache.clear();
};
