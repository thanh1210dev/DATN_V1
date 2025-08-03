import axiosInstance from '../axiosInstance';
import axios from 'axios';

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
      console.log('CategoryData type:', typeof categoryData, categoryData instanceof FormData);
      
      // Sử dụng axiosInstance với FormData format phù hợp với @RequestParam
      if (categoryData instanceof FormData) {
        console.log('Using axiosInstance with FormData for @RequestParam backend');
        const response = await axiosInstance.post('/categories', categoryData);
        console.log('Category creation successful:', response.data);
        return response.data;
      } else {
        // Fallback cho JSON data
        console.log('Using JSON data');
        const response = await axiosInstance.post('/categories', categoryData);
        return response.data;
      }
    } catch (error) {
      console.error('Category creation error:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data?.message || error.message || 'Có lỗi xảy ra khi thêm danh mục';
    }
  },

  // Update a category
  update: async (id, categoryData) => {
    try {
      let config = {};
      // FormData cần xóa Content-Type để browser tự set multipart boundary
      if (categoryData instanceof FormData) {
        config.headers = {
          'Content-Type': undefined // Xóa Content-Type để browser tự set
        };
        config.transformRequest = [(data) => data]; // Không transform FormData
      }
      
      const response = await axiosInstance.put(`/categories/${id}`, categoryData, config);
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