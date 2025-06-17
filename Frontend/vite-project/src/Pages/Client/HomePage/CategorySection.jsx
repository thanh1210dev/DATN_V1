import React from "react";
import { Link } from "react-router-dom";

const CategorySection = () => {
  const categories = [
    { id: 1, name: "Áo Polo Nam", image: "https://via.placeholder.com/300" },
    { id: 2, name: "Áo Polo Nữ", image: "https://via.placeholder.com/300" },
    { id: 3, name: "Phụ Kiện", image: "https://via.placeholder.com/300" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Danh Mục Nổi Bật</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?categoryId=${category.id}`}
            className="relative bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition"
          >
            <img src={category.image} alt={category.name} className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <h3 className="text-lg font-semibold text-white">{category.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;