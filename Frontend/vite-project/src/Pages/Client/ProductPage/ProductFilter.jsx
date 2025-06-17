import React from "react";

const ProductFilter = ({ filters, setFilters }) => {
  const categories = [
    { id: "", name: "Tất cả" },
    { id: 1, name: "Áo Polo Nam" },
    { id: 2, name: "Áo Polo Nữ" },
    { id: 3, name: "Phụ Kiện" },
  ];

  return (
    <select
      value={filters.categoryId}
      onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
      className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default ProductFilter;