import React from 'react';
import { Link } from 'react-router-dom';

const CategorySection = ({ categories }) => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Danh Mục Sản Phẩm</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 text-lg">Không có danh mục</p>
        ) : (
          categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categoryId=${category.id}`}
              className="no-underline"
            >
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300">
                <img
                  src={category.image || 'https://via.placeholder.com/150'}
                  alt={category.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default CategorySection;