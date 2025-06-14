import React, { useState, useEffect } from "react";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImageService from "../../../../Service/AdminProductSevice/ImageService";

const ImageAdmin = () => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
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
      const errorMsg = err.response?.data?.message || "Error fetching images";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // Preview images
      const previews = files.map((file) => URL.createObjectURL(file));
      setPreviewImages(previews);

      try {
        await ImageService.Upload(files);
        toast.success("Images uploaded successfully!");
        setPreviewImages([]); // Clear preview after success
        fetchImages();
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Error uploading images";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedImages.length === 0) return;
    try {
      await Promise.all(selectedImages.map((id) => ImageService.Delete(id)));
      toast.success("Images deleted successfully!");
      setSelectedImages([]);
      fetchImages();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error deleting images";
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
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Danh sách ảnh từ backend</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="mb-4">
        <input
          type="file"
          multiple
          onChange={handleUpload}
          className="mb-2 p-2 border rounded"
        />
        <button
          onClick={() => document.getElementById("fileInput").click()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        >
          Thêm ảnh vào thư mục
        </button>
      </div>

      {previewImages.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Preview Images</h3>
          <div className="flex flex-wrap gap-4">
            {previewImages.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Preview ${index}`}
                className="w-24 h-36 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={selectedImages.length === 0}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
      >
        Xóa ảnh đã chọn
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative">
            <input
              type="checkbox"
              checked={selectedImages.includes(image.id)}
              onChange={() => handleSelect(image.id)}
              className="absolute top-2 left-2 z-10"
            />
            <img
              src={`http://localhost:8080${image.url}`} // Adjust base URL
              alt={`Image ${image.id}`}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageAdmin;