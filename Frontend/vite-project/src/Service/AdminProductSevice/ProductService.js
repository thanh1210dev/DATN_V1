import axiosInstance from '../axiosInstance';

const ProductService = {
  // Get all products with pagination
  getAll: async (page, size) => {
    try {
      const response = await axiosInstance.get('/products', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách sản phẩm';
    }
  },

  // Create a new product
  create: async (productData) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm sản phẩm';
    }
  },

  // Update a product
  update: async (id, productData) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
    }
  },

  // Delete a product
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/products/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa sản phẩm';
    }
  },
};

export default ProductService;