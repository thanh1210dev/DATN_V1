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
  Delete: (imageIds) => {
    const params = new URLSearchParams();
    imageIds.forEach((id) => params.append("imageIds", id));
    return axiosInstance.delete("/images", { params });
  },
};

export default ImageService;