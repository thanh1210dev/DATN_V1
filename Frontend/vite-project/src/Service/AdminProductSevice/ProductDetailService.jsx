import axiosInstance from '../axiosInstance';

const ProductDetailService = {
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
  getAllWithZeroPromotionalPrice: async (page, size) => {
    try {
      const response = await axiosInstance.get(`/product-details/zero-promotion`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách chi tiết sản phẩm';
    }
  },
  getAllPage: async (page, size, code, name, price, sizeId, colorId) => {
    try {
      const response = await axiosInstance.get(`/product-details/all`, {
        params: { page, size, code, name, price, sizeId, colorId },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách chi tiết sản phẩm';
    }
  },
  create: async (productDetailData) => {
    try {
      const response = await axiosInstance.post('/product-details', productDetailData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi thêm chi tiết sản phẩm';
    }
  },
  update: async (id, productDetailData) => {
    try {
      const response = await axiosInstance.put(`/product-details/${id}`, productDetailData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chi tiết sản phẩm';
    }
  },
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/product-details/${id}`);
    } catch (error) {
      throw error.response?.data?.message || 'Không thể xóa chi tiết sản phẩm';
    }
  },
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/product-details/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải chi tiết sản phẩm';
    }
  },
  getAvailableSizes: async (productId) => {
    try {
      const response = await axiosInstance.get(`/product-details/${productId}/sizes`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách kích thước';
    }
  },
  getAvailableColors: async (productId, sizeId) => {
    try {
      const response = await axiosInstance.get(`/product-details/${productId}/colors`, {
        params: { sizeId },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách màu sắc';
    }
  },
  getProductDetailBySizeAndColor: async (productId, sizeId, colorId) => {
    try {
      const response = await axiosInstance.get(`/product-details/${productId}/detail`, {
        params: { sizeId, colorId },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải chi tiết sản phẩm';
    }
  },
};

export default ProductDetailService;