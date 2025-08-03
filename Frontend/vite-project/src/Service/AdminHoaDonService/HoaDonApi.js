import axiosInstance from "../axiosInstance";

const HoaDonApi = {
  // Fetch bills with advanced search
  searchBillsAdvanced: async (params) => {
    try {
      const response = await axiosInstance.get("/bills/search-advanced", { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Lỗi khi lấy danh sách hóa đơn");
    }
  },

  // Fetch bill details by bill ID  /online-orders
  getBill: async (billId) => {
    try {
      const response = await axiosInstance.get(`/bills/${billId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Lỗi khi lấy chi tiết hóa đơn");
    }
  },

  // Fetch bill detail items by bill ID with pagination
  getBillDetails: async (billId, page = 0, size = 5) => {
    try {
      const response = await axiosInstance.get(`/bills/${billId}/details`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Lỗi khi lấy danh sách chi tiết hóa đơn");
    }
  },

  // Fetch total count for a specific status
  getTotalBillsByStatus: async (status) => {
    try {
      const response = await axiosInstance.get("/bills/search-advanced", {
        params: { status, page: 0, size: 1 },
      });
      return response.data.totalElements || 0;
    } catch (error) {
      console.error(`Error fetching total for status ${status}:`, error);
      return 0;
    }
  },

  // Print invoice for a bill
  printInvoice: async (billId) => {
    try {
      const response = await axiosInstance.get(`/bills/${billId}/print`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Lỗi khi tạo hóa đơn PDF");
    }
  },

  // Fetch product details for selection
  getProductDetails: async (page, size, code, name, price, sizeId, colorId) => {
    try {
      const response = await axiosInstance.get('/product-details/all', {
        params: { page, size, code, name, price, sizeId, colorId },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách sản phẩm');
    }
  },

  // Add product to bill
  addProductToBill: async (billId, request) => {
    try {
      const response = await axiosInstance.post(`/online-orders/${billId}/products`, request);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi thêm sản phẩm vào hóa đơn');
    }
  },

  // Remove product from bill
  removeProductFromBill: async (billDetailId) => {
    try {
      await axiosInstance.delete(`/online-orders/products/${billDetailId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa sản phẩm khỏi hóa đơn');
    }
  },

  // Fetch order history
  getOrderHistory: async (billId) => {
    try {
      const response = await axiosInstance.get(`/online-orders/${billId}/history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch sử đơn hàng');
    }
  },

  // Update COD payment amount
  updateCODPayment: async (billId, amount) => {
    try {
      const response = await axiosInstance.put(`/online-orders/${billId}/cod-payment`, null, {
        params: { amount },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật số tiền COD');
    }
  },

  // Update bill status and synchronize product statuses
  updateBillStatus: async (billId, newStatus, customerPayment = null) => {
    try {
      console.log('🔥 updateBillStatus called with:', { billId, newStatus, customerPayment });
      
      // Validate inputs
      if (!billId || !newStatus) {
        throw new Error('Bill ID and status are required');
      }
      
      // Check axiosInstance
      if (!axiosInstance) {
        console.error('❌ axiosInstance is undefined!');
        throw new Error('HTTP client not available');
      }
      
      console.log('🔥 axiosInstance check passed, defaults:', axiosInstance.defaults);
      
      const params = { status: newStatus };
      if (customerPayment !== null) {
        params.customerPayment = customerPayment;
      }
      
      const endpoint = `/bills/${billId}/status`;
      console.log('🌐 API Call Debug:', {
        endpoint,
        billId,
        newStatus,
        params,
        axiosInstanceExists: !!axiosInstance,
        baseURL: axiosInstance?.defaults?.baseURL || 'undefined'
      });
      
      const response = await axiosInstance.put(endpoint, null, {
        params,
        timeout: 10000, // 10 second timeout
      });
      
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', {
        endpoint: `/bills/${billId}/status`,
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config,
        code: error.code
      });
      
      // Better error message based on status code
      let errorMessage = 'Lỗi khi cập nhật trạng thái hóa đơn';
      if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy hóa đơn';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server nội bộ';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Không thể kết nối đến server';
      } else if (error.code === 'TIMEOUT') {
        errorMessage = 'Yêu cầu quá thời gian chờ';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Update customer payment
  updateCustomerPayment: async (billId, amount) => {
    try {
      const response = await axiosInstance.put(`/online-orders/${billId}/customer-payment`, null, {
        params: { amount },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật số tiền khách trả');
    }
  },

  // Update bill address
  updateBillAddress: async (billId, request) => {
    try {
      const response = await axiosInstance.put(`/online-orders/${billId}/address`, request);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật địa chỉ hóa đơn');
    }
  },

  // Fetch provinces from GHN API
  getProvinces: async () => {
    try {
      const response = await axiosInstance.get('/ghn-address/provinces');
      return response.data.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách tỉnh/thành');
    }
  },

  // Fetch districts from GHN API
  getDistricts: async (provinceId) => {
    try {
      const response = await axiosInstance.get('/ghn-address/districts', {
        params: { provinceId },
      });
      return response.data.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách quận/huyện');
    }
  },

  // Fetch wards from GHN API
  getWards: async (districtId) => {
    try {
      const response = await axiosInstance.get('/ghn-address/wards', {
        params: { districtId },
      });
      return response.data.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách phường/xã');
    }
  },
};

export default HoaDonApi;