import axiosInstance from '../axiosInstance';

const CategoryService = {
  // Get all categories with pagination
  getAll: async (page, size) => {
    try {
      const response = await axiosInstance.get('/categories', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách danh mục';
    }
  },

  // Create a new category
  create: async (categoryData) => {
    try {
      let config = {};
      // Đừng tự set Content-Type khi dùng FormData!
      if (categoryData instanceof FormData) {
        config.withCredentials = true; // nếu backend dùng session/cookie
        // Không set headers['Content-Type'] ở đây!
      }
      const response = await axiosInstance.post('/categories', categoryData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm danh mục';
    }
  },

  // Update a category
  update: async (id, categoryData) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật danh mục';
    }
  },

  // Delete a category
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/categories/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa danh mục';
    }
  },
};

export default CategoryService;