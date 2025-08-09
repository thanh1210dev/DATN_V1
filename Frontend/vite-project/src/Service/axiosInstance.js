import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',  // Bỏ /api khỏi baseURL
  withCredentials: true, // Tắt credentials vì dùng JWT Bearer token
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  maxRedirects: 0, // Tắt redirect để tránh bị redirect về login
  timeout: 5000
});

// Hàm utility
const isAddressEndpoint = (url) => url?.includes('/cart-checkout/address');
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
    // Log the final URL that will be requested
    const fullURL = config.baseURL ? config.baseURL + config.url : config.url;
    console.log('🔵 [AXIOS REQUEST] Full URL being requested:', fullURL);
    console.log('🔵 [AXIOS REQUEST] Base URL:', config.baseURL);
    console.log('🔵 [AXIOS REQUEST] Relative URL:', config.url);
    console.log('🔵 [AXIOS REQUEST] Method:', config.method?.toUpperCase());
    
    const token = localStorage.getItem("token");
    console.log('🔵 [AXIOS REQUEST] Token exists:', !!token);
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔵 [AXIOS REQUEST] Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('❌ [AXIOS REQUEST] No token found in localStorage');
    }
    
    // Log all headers being sent
    console.log('🔵 [AXIOS REQUEST] Request headers:', config.headers);
    
    // Kiểm tra nếu data là FormData thì không set Content-Type
    if (config.data instanceof FormData) {
      // Xóa Content-Type để browser tự set với boundary
      delete config.headers['Content-Type'];
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
    console.log('✅ [AXIOS RESPONSE] Received response from:', response.config.url);
    console.log('✅ [AXIOS RESPONSE] Status:', response.status);
    console.log('✅ [AXIOS RESPONSE] Response data type:', typeof response.data);
    console.log('✅ [AXIOS RESPONSE] Response data preview:',
      typeof response.data === 'string' ? response.data.substring(0, 100) + '...' : response.data);

    // Đảm bảo dữ liệu trả về đúng định dạng
    if (isAddressEndpoint(response.config.url)) {
      // Chỉ ép kiểu về mảng cho các request GET danh sách địa chỉ
      const method = (response.config.method || 'get').toLowerCase();
      if (method === 'get') {
        return {
          ...response,
          data: Array.isArray(response.data) ? response.data : []
        };
      }
      // Với POST/PUT/DELETE, trả về dữ liệu gốc để component xử lý
      return response;
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
    console.log('❌ [AXIOS ERROR] Request failed');
    console.log('❌ [AXIOS ERROR] URL:', error.config?.url);
    console.log('❌ [AXIOS ERROR] Method:', error.config?.method?.toUpperCase());
    console.log('❌ [AXIOS ERROR] Error message:', error.message);
    
    if (error.response) {
      console.log('❌ [AXIOS ERROR] Response status:', error.response.status);
      console.log('❌ [AXIOS ERROR] Response data type:', typeof error.response.data);
      console.log('❌ [AXIOS ERROR] Response data preview:', 
        typeof error.response.data === 'string' ? 
          error.response.data.substring(0, 200) + '...' : 
          error.response.data);
      console.log('❌ [AXIOS ERROR] Response headers:', error.response.headers);
    } else if (error.request) {
      console.log('❌ [AXIOS ERROR] Request made but no response received');
      console.log('❌ [AXIOS ERROR] Request details:', error.request);
    }
    
    // Không log lỗi với các request bị reject do userId không hợp lệ
    if (error.message === 'Invalid userId') {
      return { data: [] };
    }

    const { config, response } = error;
    
    // Xử lý lỗi 401 Unauthorized
    if (response && response.status === 401) {
      console.warn('Token expired or invalid');
      // Không ép redirect với các flow guest/public
      const url = config?.url || '';
  const isGuestFlow = url.includes('/guest-checkout/order') || url.includes('/guest-checkout/process-payment') || url.includes('/ghn-address/') || url.includes('/cart-checkout/calculate-shipping');
      if (isGuestFlow) {
        return Promise.reject(new Error('Authentication required'));
      }
      
      // Kiểm tra xem có phải đang trong quá trình thanh toán VNPAY không
      const isVnpayFlow = window.location.pathname.includes('/payment-result') || 
                         window.location.search.includes('vnp_') ||
                         sessionStorage.getItem('vnpayProcessing') === 'true' ||
                         sessionStorage.getItem('vnpaySuccessTransition') === 'true';
      
      // Chỉ clear token và redirect nếu đây KHÔNG phải là request test token 
      // và KHÔNG trong quá trình thanh toán VNPAY
  if (!config?.url?.includes('/api/user/me') && !isVnpayFlow) {
        console.log('Clearing authentication due to 401 error');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('name');
        localStorage.removeItem('selectedRole');
        
        // Redirect về login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          console.log('Redirecting to login due to authentication failure');
          window.location.href = '/login';
        }
      } else if (isVnpayFlow) {
        console.log('Skipping auto-logout due to VNPAY flow');
      }
      
      return Promise.reject(new Error('Authentication required'));
    }
    
    // Xử lý endpoint address
    if (isAddressEndpoint(config?.url)) {
      console.log('Lỗi khi gọi API address:', error.message);
      const method = (config?.method || 'get').toLowerCase();
      // Với GET: trả về mảng rỗng để UI an toàn khi render
      if (method === 'get') {
        return { data: [] };
      }
      // Với POST/PUT/DELETE: propagate lỗi để component có thể hiện toast
      return Promise.reject(error);
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
