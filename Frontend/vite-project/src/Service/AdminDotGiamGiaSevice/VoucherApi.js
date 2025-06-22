import axiosInstance from "../axiosInstance";

const VoucherApi = {
  searchVouchers: (params) =>
    axiosInstance.get("/vouchers/search", { params }),

  createVoucher: (data) =>
    axiosInstance.post("/vouchers", data),

  assign: (request) =>
    axiosInstance.post("/account-vouchers/assign", request),

  UserVoucher: (userId, page = 0, size = 5) =>
    axiosInstance.get(`/account-vouchers/user/${userId}?page=${page}&size=${size}`),

  updateVoucher: (id, data) =>
    axiosInstance.put(`/vouchers/${id}`, data),

  getVoucherById: (id) =>
    axiosInstance.get(`/vouchers/${id}`),

  deleteVoucher: (id) =>
    axiosInstance.delete(`/vouchers/${id}`),
};

export default VoucherApi;