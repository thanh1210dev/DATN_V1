import axiosInstance from '../axiosInstance';

const ProductDetailService = {
  // Get all product details for a product with pagination
  getAll: async (productId, page, size) => {
    try {
      const response = await axiosInstance.get(`/product-details/all/${productId}`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách chi tiết sản phẩm';
    }
  },

  // Create a new product detail
  create: async (productDetailData) => {
    try {
      const response = await axiosInstance.post('/product-details', productDetailData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm chi tiết sản phẩm';
    }
  },

  // Update a product detail
  update: async (id, productDetailData) => {
    try {
      const response = await axiosInstance.put(`/product-details/${id}`, productDetailData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chi tiết sản phẩm';
    }
  },

  // Delete a product detail
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/product-details/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa chi tiết sản phẩm';
    }
  },

  // Get product detail by ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/product-details/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải chi tiết sản phẩm';
    }
  },
};

export default ProductDetailService;