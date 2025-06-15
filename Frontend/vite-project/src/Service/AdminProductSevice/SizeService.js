import axiosInstance from '../axiosInstance';

const SizeService = {
  // Get all sizes with pagination
  getAll: async (page, size) => {
    try {
      const response = await axiosInstance.get('/sizes', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách kích thước';
    }
  },

  // Create a new size
  create: async (sizeData) => {
    try {
      const response = await axiosInstance.post('/sizes', sizeData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm kích thước';
    }
  },

  // Update a size
  update: async (id, sizeData) => {
    try {
      const response = await axiosInstance.put(`/sizes/${id}`, sizeData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật kích thước';
    }
  },

  // Delete a size
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/sizes/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa kích thước';
    }
  },
};

export default SizeService;