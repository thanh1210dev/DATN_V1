import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  maxRedirects: 5, // Cho phép tối đa 5 redirects
  timeout: 5000
});

// Hàm utility
const isAddressEndpoint = (url) => url?.includes('/cart-checkout/address/');
const isShippingEndpoint = (url) => url?.includes('/calculate-shipping');

// Validate userId
const isValidUserId = (url) => {
  if (!isAddressEndpoint(url)) return true;
  const parts = url.split('/');
  const userId = parts[parts.length - 1].split('?')[0]; // Remove query params if any
  return userId && !isNaN(userId) && parseInt(userId) > 0;
};

// Request interceptor để thêm token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Kiểm tra userId với endpoint address
    if (isAddressEndpoint(config.url) && !isValidUserId(config.url)) {
      // Reject request ngay từ đầu nếu userId không hợp lệ
      return Promise.reject(new Error('Invalid userId'));
    }
    
    // Disable redirects cho một số endpoint có thể gây loop
    if (config.url && (config.url.includes('/login') || config.url.includes('/auth'))) {
      config.maxRedirects = 0;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý lỗi tập trung
instance.interceptors.response.use(
  (response) => {
    // Đảm bảo dữ liệu trả về đúng định dạng
    if (isAddressEndpoint(response.config.url)) {
      return {
        ...response,
        data: Array.isArray(response.data) ? response.data : []
      };
    }
    if (isShippingEndpoint(response.config.url)) {
      const fee = Number(response.data);
      return {
        ...response,
        data: isNaN(fee) ? 22000 : fee
      };
    }
    return response;
  },
  (error) => {
    // Không log lỗi với các request bị reject do userId không hợp lệ
    if (error.message === 'Invalid userId') {
      return { data: [] };
    }

    const { config, response } = error;
    
    // Xử lý lỗi 401 Unauthorized
    if (response && response.status === 401) {
      console.warn('Token expired or invalid');
      
      // Chỉ clear token và redirect nếu đây KHÔNG phải là request test token
      if (!config?.url?.includes('/api/user/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('name');
        localStorage.removeItem('selectedRole');
        
        // Redirect về login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(new Error('Authentication required'));
    }
    
    // Xử lý endpoint address
    if (isAddressEndpoint(config?.url)) {
      console.log('Lỗi khi gọi API address:', error.message);
      return { data: [] };
    }
    
    // Xử lý endpoint shipping
    if (isShippingEndpoint(config?.url)) {
      console.log('Lỗi khi tính phí ship:', error.message);
      return { data: 22000 };
    }
    
    return Promise.reject(error);
  }
);

// Wrap axios instance với xử lý lỗi bổ sung
const axiosInstance = {
  async get(url, config = {}) {
    return instance.get(url, config);
  },

  async post(url, data, config = {}) {
    return instance.post(url, data, config);
  },

  async put(url, data, config = {}) {
    return instance.put(url, data, config);
  },

  async delete(url, config = {}) {
    return instance.delete(url, config);
  },

  // Utility function để logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  },

  // Duy trì tham chiếu đến instance gốc nếu cần
  instance
};

export default axiosInstance;
