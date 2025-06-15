import axiosInstance from '../axiosInstance';

const MaterialService = {
  // Get all materials with pagination
  getAll: async (page, size) => {
    try {
      const response = await axiosInstance.get('/materials', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách chất liệu';
    }
  },

  // Create a new material
  create: async (materialData) => {
    try {
      const response = await axiosInstance.post('/materials', materialData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm chất liệu';
    }
  },

  // Update a material
  update: async (id, materialData) => {
    try {
      const response = await axiosInstance.put(`/materials/${id}`, materialData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chất liệu';
    }
  },

  // Delete a material
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/materials/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa chất liệu';
    }
  },
};

export default MaterialService;