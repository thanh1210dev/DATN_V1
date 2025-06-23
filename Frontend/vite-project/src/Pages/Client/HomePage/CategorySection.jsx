import React from "react";
import { Link } from "react-router-dom";

const CategorySection = ({ categories }) => {
  return (
    <div className="py-8 px-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Danh mục sản phẩm</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">Không có danh mục</p>
        ) : (
          categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categoryId=${category.id}`}
              className="no-underline"
            >
              <div className="bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default CategorySection;