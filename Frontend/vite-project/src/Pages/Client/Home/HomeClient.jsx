import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HomeClient = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("id");
    localStorage.removeItem("selectedRole");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="text-3xl font-bold text-gray-800">Cửa Hàng Áo Đẹp</div>
        <nav className="space-x-6">
          <a href="#home" className="text-gray-700 hover:text-blue-600 transition duration-300">Trang Chủ</a>
          <a href="#products" className="text-gray-700 hover:text-blue-600 transition duration-300">Sản Phẩm</a>
          <a href="#contact" className="text-gray-700 hover:text-blue-600 transition duration-300">Liên Hệ</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Chào Mừng Đến Với Shop Áo</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Sản phẩm mẫu */}
          <div className="bg-white p-6 shadow-xl rounded-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2">
            <img src="https://tse4.mm.bing.net/th?id=OIP._S7PdaykNRHuS0SnGyKzqAHaJR&pid=Api&P=0&h=180" alt="Áo Thun Trơn" className="w-full h-64 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Áo Thun Trơn</h2>
            <p className="text-gray-600 mt-2">200.000 VNĐ</p>
            <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
              Thêm Vào Giỏ
            </button>
          </div>
          <div className="bg-white p-6 shadow-xl rounded-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2">
            <img src="https://tse3.mm.bing.net/th?id=OIP.WqVnY64JAjngwX2pRg6aegHaHa&pid=Api&P=0&h=180" alt="Áo Sơ Mi" className="w-full h-64 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Áo Sơ Mi</h2>
            <p className="text-gray-600 mt-2">350.000 VNĐ</p>
            <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
              Thêm Vào Giỏ
            </button>
          </div>
          <div className="bg-white p-6 shadow-xl rounded-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2">
            <img src="https://gendai.com.vn/vnt_upload/product/06_2023/22.jpg" alt="Áo Hoodie" className="w-full h-64 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Áo Hoodie</h2>
            <p className="text-gray-600 mt-2">500.000 VNĐ</p>
            <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
              Thêm Vào Giỏ
            </button>
          </div>
        </div>
      </main>

      {/* Nút Đăng Nhập/Đăng Xuất ở góc trái */}
      {isLoggedIn ? (
        <button
          onClick={handleLogoutClick}
          className="fixed bottom-6 left-6 bg-red-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-600 transition duration-300 transform hover:-translate-y-1"
        >
          Đăng Xuất
        </button>
      ) : (
        <button
          onClick={handleLoginClick}
          className="fixed bottom-6 left-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300 transform hover:-translate-y-1"
        >
          Đăng Nhập
        </button>
      )}
    </div>
  );
};

export default HomeClient;