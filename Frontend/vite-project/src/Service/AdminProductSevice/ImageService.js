import axiosInstance from "../axiosInstance";

const ImageService = {
  GetAll: () => axiosInstance.get("/images"),
  Upload: (files) => {
    const formData = new FormData();
    for (let file of files) {
      formData.append("files", file);
    }
    return axiosInstance.post("/images/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  Delete: (imageId) => axiosInstance.delete(`/images/${imageId}`),
};

export default ImageService;