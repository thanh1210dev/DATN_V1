import axiosInstance from '../axiosInstance';

const HomeService = {
   // Lấy sản phẩm mới nhất
  getNewest: async (page = 0, size = 8) => {
    try {
      const response = await axiosInstance.get('/products/newest', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải sản phẩm mới nhất';
    }
  },

  // Lấy sản phẩm khuyến mãi
  getSale: async (page = 0, size = 8) => {
    try {
      const response = await axiosInstance.get('/products/sale', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải sản phẩm khuyến mãi';
    }
  },

  // Lấy sản phẩm bán chạy
  getBestSeller: async (page = 0, size = 8) => {
    try {
      const response = await axiosInstance.get('/products/best-seller', {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải sản phẩm bán chạy';
    }
  },
}
export default HomeService;