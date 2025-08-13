import axiosInstance from '../axiosInstance';

const UserService = {
  // Search users by code and name with pagination
  findByCodeAndName: async (code, name, page, size) => {
    try {
      const response = await axiosInstance.get('/user/search', { params: { code, name, page, size } });
      return response.data;
    } catch (error) {
      throw error; // propagate full error for parser
    }
  },

  // Search client users by code and name with pagination
  findByCodeAndNameClient: async (code, name, page, size) => {
    try {
      const response = await axiosInstance.get('/user/search/client', { params: { code, name, page, size } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get top purchasers with pagination
  findTopPurchasers: async (code, name, page, size) => {
    try {
      const response = await axiosInstance.get('/user/top-purchasers', { params: { code, name, page, size } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new user
  create: async (userData) => {
    try {
      console.log('[USER_API][CREATE] payload', { ...userData, password: userData.password ? `len:${userData.password.length}` : null });
      const response = await axiosInstance.post('/user', userData);
      console.log('[USER_API][CREATE][SUCCESS]', response.data);
      return response.data;
    } catch (error) {
      console.error('[USER_API][CREATE][ERROR]', error.response?.data || error.message);
      throw error; // keep structure for parser
    }
  },

  // Upload image (avatar) - expects FormData with key 'files'
  uploadImage: async (formData) => {
    try {
      const response = await axiosInstance.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Upload ảnh thất bại';
    }
  },

  // Update a user
  update: async (id, userData) => {
    try {
      console.log('[USER_API][UPDATE] id', id, 'payload', { ...userData, password: userData.password ? `len:${userData.password.length}` : null });
      const response = await axiosInstance.put(`/user/${id}`, userData);
      console.log('[USER_API][UPDATE][SUCCESS]', response.data);
      return response.data;
    } catch (error) {
      console.error('[USER_API][UPDATE][ERROR]', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user by ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/user/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Soft delete a user
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/user/${id}`);
    } catch (error) {
      throw error;
    }
  },
};

export default UserService;