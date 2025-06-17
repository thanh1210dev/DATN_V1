import axiosInstance from "../axiosInstance";

const DotGiamGiaApi = {
  // Tìm kiếm đợt giảm giá
  search: async (params) => {
    try {
      return await axiosInstance.get("/promotions/search", { params });
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi tìm kiếm" };
    }
  },

  // Tạo mới
  create: async (promotionData) => {
    try {
      return await axiosInstance.post("/promotions", promotionData);
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi tạo mới" };
    }
  },

  // Cập nhật
  update: async (id, promotionData) => {
    try {
      return await axiosInstance.put(`/promotions/${id}`, promotionData);
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi cập nhật" };
    }
  },

  // Lấy theo ID
  getById: async (id) => {
    try {
      return await axiosInstance.get(`/promotions/${id}`);
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi lấy thông tin" };
    }
  },

  // Xóa mềm
  softDelete: async (id) => {
    try {
      return await axiosInstance.delete(`/promotions/${id}`);
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi xóa" };
    }
  },

  // Gán khuyến mãi cho nhiều sản phẩm
  assignToMultiple: async (assignRequest) => {
    try {
      return await axiosInstance.post("/promotions/assign", assignRequest);
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi gán khuyến mãi" };
    }
  },

  // Gán khuyến mãi cho 1 sản phẩm chi tiết
  assignToSingle: async (assignSingleRequest) => {
    try {
      return await axiosInstance.post("/promotions/assign-single", assignSingleRequest);
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi gán khuyến mãi cho chi tiết sản phẩm" };
    }
  },

  // Lấy danh sách sản phẩm đã được gán khuyến mãi với phân trang
  getPromotionProducts: async (promotionId, page = 0, size = 10) => {
    try {
      return await axiosInstance.get(`/promotions/${promotionId}/products`, {
        params: { page, size }
      });
    } catch (error) {
      throw error.response?.data || { message: "Lỗi không xác định khi lấy danh sách sản phẩm khuyến mãi" };
    }
  },
};

export default DotGiamGiaApi;