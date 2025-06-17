import React from "react";
import ProductCard from "../ProductPage/ProductCard";

const FeaturedProducts = ({ products }) => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Sản Phẩm Nổi Bật</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">Không có sản phẩm</p>
        ) : (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;