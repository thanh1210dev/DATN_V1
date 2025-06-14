import axiosInstance from "../axiosInstance";

const DotGiamGiaApi = {

  search: (params) =>
    axiosInstance.get("/promotions/search", { params }),

  create: (promotionData) =>
    axiosInstance.post("/promotions", promotionData),


  update: (id, promotionData) =>
    axiosInstance.put(`/promotions/${id}`, promotionData),


  getById: (id) => axiosInstance.get(`/promotions/${id}`),

  softDelete: (id) => axiosInstance.delete(`/promotions/${id}`),
};

export default DotGiamGiaApi;
