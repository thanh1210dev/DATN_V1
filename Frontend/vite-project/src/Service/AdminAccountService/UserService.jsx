import axiosInstance from '../axiosInstance';

const UserService = {
  // Search users by code and name with pagination
  findByCodeAndName: async (code, name, page, size) => {
    try {
      const response = await axiosInstance.get('/user/search', {
        params: { code, name, page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách người dùng';
    }
  },

  // Search client users by code and name with pagination
  findByCodeAndNameClient: async (code, name, page, size) => {
    try {
      const response = await axiosInstance.get('/user/search/client', {
        params: { code, name, page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách khách hàng';
    }
  },

  // Get top purchasers with pagination
  findTopPurchasers: async (code, name, page, size) => {
    try {
      const response = await axiosInstance.get('/user/top-purchasers', {
        params: { code, name, page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách người mua hàng đầu';
    }
  },

  // Create a new user
  create: async (userData) => {
    try {
      const response = await axiosInstance.post('/user', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm người dùng';
    }
  },

  // Update a user
  update: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/user/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng';
    }
  },

  // Get user by ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/user/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải thông tin người dùng';
    }
  },

  // Soft delete a user
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/user/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa người dùng';
    }
  },
};

export default UserService;