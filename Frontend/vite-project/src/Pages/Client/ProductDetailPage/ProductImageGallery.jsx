import React, { useState } from 'react';

const ProductImageGallery = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images?.length || 1));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (images?.length || 1)) % (images?.length || 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="p-4">
        <img
          src="https://via.placeholder.com/500?text=Không+có+ảnh"
          alt="No Image"
          className="w-full h-96 object-cover rounded-xl shadow-md"
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        <img
          src={images[currentImageIndex]?.url ? `http://localhost:8080${images[currentImageIndex].url}` : 'https://via.placeholder.com/500?text=Ảnh+lỗi'}
          alt={`Sản phẩm ${currentImageIndex}`}
          className="w-full h-96 object-cover rounded-xl shadow-md cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => setIsModalOpen(true)}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition duration-200"
            >
              ←
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition duration-200"
            >
              →
            </button>
          </>
        )}
      </div>
      <div className="flex gap-3 mt-4 justify-center">
        {images.map((image, index) => (
          <img
            key={image.id}
            src={image.url ? `http://localhost:8080${image.url}` : 'https://via.placeholder.com/100?text=Ảnh+lỗi'}
            alt={`Thumbnail ${image.id}`}
            className={`w-16 h-16 object-cover rounded-lg cursor-pointer transition-opacity duration-300 ${currentImageIndex === index ? 'border-2 border-indigo-600 opacity-100' : 'opacity-60 hover:opacity-100'}`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl w-full">
            <img
              src={images[currentImageIndex]?.url ? `http://localhost:8080${images[currentImageIndex].url}` : 'https://via.placeholder.com/800?text=Ảnh+lỗi'}
              alt={`Zoomed ${currentImageIndex}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition duration-200"
            >
              ×
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition duration-200"
                >
                  ←
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition duration-200"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;