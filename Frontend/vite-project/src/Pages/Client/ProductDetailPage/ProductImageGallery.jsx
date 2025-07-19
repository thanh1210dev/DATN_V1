import React, { useState, useRef } from 'react';

const ProductImageGallery = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const imageRef = useRef(null);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (images?.length || 1));
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (images?.length || 1)) % (images?.length || 1));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - imageRef.current.offsetLeft);
    setScrollLeft(imageRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - imageRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    imageRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const noImageUrl = '/no-image.jpg';

  if (!images || images.length === 0) {
    return (
      <div className="flex gap-4">
        {/* Thumbnails dọc bên trái */}
        <div className="flex flex-col gap-2">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        </div>
        {/* Ảnh chính bên phải */}
        <div className="flex-1">
          <img
            src={noImageUrl}
            alt="No Image"
            className="w-full h-[500px] object-cover rounded-lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Thumbnails dọc bên trái */}
      <div className="flex flex-col gap-2">
        {images.map((image, index) => (
          <img
            key={image.id}
            src={image.url ? `http://localhost:8080${image.url}` : noImageUrl}
            alt={`Thumbnail ${index + 1}`}
            className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all duration-200 ${
              currentImageIndex === index 
                ? 'border-2 border-black opacity-100' 
                : 'border border-gray-300 opacity-70 hover:opacity-100'
            }`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      
      {/* Ảnh chính bên phải */}
      <div className="flex-1 relative">
        <div
          ref={imageRef}
          className="relative overflow-hidden rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <img
            src={images[currentImageIndex]?.url ? `http://localhost:8080${images[currentImageIndex].url}` : noImageUrl}
            alt={`Sản phẩm ${currentImageIndex + 1}`}
            className="w-full h-[500px] object-cover select-none"
            draggable={false}
          />
          
          {/* Nút điều hướng ảnh */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition duration-200 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition duration-200 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImageGallery;