import React, { useState, useEffect } from "react";
import ImageService from "../../../../Service/AdminProductSevice/ImageService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ImageAdmin = () => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await ImageService.GetAll();
      setImages(response.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Lỗi khi lấy hình ảnh";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  const handleRemovePreview = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn hình ảnh để thêm!");
      return;
    }
    try {
      await ImageService.Upload(selectedFiles);
      toast.success("Thêm hình ảnh thành công!");
      setSelectedFiles([]);
      setPreviewImages([]);
      fetchImages();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Lỗi khi thêm hình ảnh";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (selectedImages.length === 0) return;
    try {
      await ImageService.Delete(selectedImages);
      toast.success("Xóa hình ảnh thành công!");
      setSelectedImages([]);
      fetchImages();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Lỗi khi xóa hình ảnh";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSelect = (id) => {
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Quản lý danh sách ảnh</h2>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn hình ảnh</label>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="mb-2 p-2 border border-purple-300 rounded-lg w-full bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
          />
          <button
            onClick={handleAddImages}
            disabled={selectedFiles.length === 0}
            className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-purple-300 disabled:cursor-not-allowed"
          >
            Thêm ảnh
          </button>
        </div>
      </div>

      {previewImages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Xem trước hình ảnh</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md"
                />
                <button
                  onClick={() => handleRemovePreview(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition duration-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={selectedImages.length === 0}
        className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-purple-300 disabled:cursor-not-allowed mb-6"
      >
        Xóa ảnh đã chọn
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <input
              type="checkbox"
              checked={selectedImages.includes(image.id)}
              onChange={() => handleSelect(image.id)}
              className="absolute top-2 left-2 z-10"
            />
            <img
              src={`http://localhost:8080${image.url}`}
              alt={`Image ${image.id}`}
              className="w-full h-48 object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageAdmin;