import axiosInstance from '../axiosInstance';

const BrandService = {
 
  getAll: async (page, size) => {
    try {
      const response = await axiosInstance.get('/brands', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách thương hiệu';
    }
  },

  create: async (brandData) => {
    try {
      const response = await axiosInstance.post('/brands', brandData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm thương hiệu';
    }
  },

  update: async (id, brandData) => {
    try {
      const response = await axiosInstance.put(`/brands/${id}`, brandData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thương hiệu';
    }
  },


  delete: async (id) => {
    try {
      await axiosInstance.delete(`/brands/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa thương hiệu';
    }
  },
};

export default BrandService;