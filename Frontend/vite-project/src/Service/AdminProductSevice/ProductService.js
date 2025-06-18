import axiosInstance from '../axiosInstance';

const ProductService = {
  getAll: async (page, size, code, name, materialId, brandId, categoryId, minPrice, maxPrice) => {
    try {
      const response = await axiosInstance.get('/products', {
        params: { page, size, code, name, materialId, brandId, categoryId, minPrice, maxPrice },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách sản phẩm';
    }
  },

  create: async (productData) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm';
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải thông tin sản phẩm';
    }
  },

  update: async (id, productData) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
    }
  },

  delete: async (id) => {
    try {
      await axiosInstance.delete(`/products/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa sản phẩm';
    }
  },
};

export default ProductService;