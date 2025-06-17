import React from "react";

const ProductImageGallery = ({ images }) => {
  return (
    <div className="p-4">
      <img
        src={images && images[0]?.url ? images[0].url : "https://via.placeholder.com/500"}
        alt="Sản phẩm"
        className="w-full h-96 object-cover rounded-lg"
      />
      <div className="flex gap-2 mt-4">
        {images?.map((image) => (
          <img
            key={image.id}
            src={image.url || "https://via.placeholder.com/100"}
            alt="Thumbnail"
            className="w-20 h-20 object-cover rounded-lg cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;