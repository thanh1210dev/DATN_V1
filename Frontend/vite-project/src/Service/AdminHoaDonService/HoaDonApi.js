import axiosInstance from "../axiosInstance";

const HoaDonApi = {
  // Fetch bills with advanced search
  searchBillsAdvanced: async (params) => {
    try {
      const response = await axiosInstance.get("/bills/search-advanced", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Lỗi khi lấy danh sách hóa đơn";
    }
  },

  // Fetch bill details by bill ID
  getBill: async (billId) => {
    try {
      const response = await axiosInstance.get(`/bills/${billId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Lỗi khi lấy chi tiết hóa đơn";
    }
  },

  // Fetch bill detail items by bill ID with pagination
  getBillDetails: async (billId, page = 0, size = 5) => {
    try {
      const response = await axiosInstance.get(`/bills/${billId}/details`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || "Lỗi khi lấy danh sách chi tiết hóa đơn";
    }
  },

  // Fetch total count for a specific status
  getTotalBillsByStatus: async (status) => {
    try {
      const response = await axiosInstance.get("/bills/search-advanced", {
        params: { status, page: 0, size: 1 }, // Use size=1 to minimize data
      });
      return response.data.totalElements || 0;
    } catch (error) {
      console.error(`Error fetching total for status ${status}:`, error);
      return 0;
    }
  },
};

export default HoaDonApi;