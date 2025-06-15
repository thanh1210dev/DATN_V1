import axiosInstance from '../axiosInstance';

const ColorService = {
  // Get all colors with pagination
  getAll: async (page, size) => {
    try {
      const response = await axiosInstance.get('/colors', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách màu sắc';
    }
  },

  // Create a new color
  create: async (colorData) => {
    try {
      const response = await axiosInstance.post('/colors', colorData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm màu sắc';
    }
  },

  // Update a color
  update: async (id, colorData) => {
    try {
      const response = await axiosInstance.put(`/colors/${id}`, colorData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật màu sắc';
    }
  },

  // Delete a color
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/colors/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa màu sắc';
    }
  },
};

export default ColorService;