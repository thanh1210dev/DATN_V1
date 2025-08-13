import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebookF, FaTwitter } from "react-icons/fa";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    name: "",
    email: "",
    phoneNumber: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
  });

  // Role is fixed to CLIENT on backend; no selection needed

  // Generate options for day, month, and year
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { birthDay, birthMonth, birthYear, ...rest } = formData;

    // Validate birth date
    if (!birthDay || !birthMonth || !birthYear) {
      toast.error("Vui lòng chọn đầy đủ ngày, tháng, năm sinh");
      return;
    }

    // Format birth date as yyyy-MM-dd
    const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, "0")}-${birthDay.toString().padStart(2, "0")}`;

    // Validate past date
    const selectedDate = new Date(birthDate);
    if (selectedDate >= new Date()) {
      toast.error("Ngày sinh phải là ngày trong quá khứ");
      return;
    }

    try {
  const { role, ...restNoRole } = rest; // ensure no role sent
  const payload = { ...restNoRole, birthDate };
      await axios.post("http://localhost:8080/api/user/register", payload);
      toast.success("Đăng ký thành công!");
      navigate("/login");
    } catch (error) {
      const errData = error?.response?.data;
      if (typeof errData === "string") {
        toast.error(errData);
      } else if (errData?.message) {
        toast.error(errData.message);
      } else {
        toast.error("Đã có lỗi xảy ra!");
      }
    }
  };


  const images = [
    "https://2.bp.blogspot.com/-yvcnu-W-hvw/XjvvDTTD47I/AAAAAAAARGo/T-EO0HXUsyEO_iohJMPl4GNePl1v8t37ACLcBGAsYHQ/s1600/Ao-thun-Polo-nam-Burberry-Ha-Noi-TPHCM-hang-hieu-sieu-cap-mau-trang-dep-co-co-be-co-Big-Size-lon-cho-nguoi-to-beo-map-fake-1-chinh-hang-ship-toan-Viet-Nam-2.jpg",
    "https://dongphuchaianh.vn/wp-content/uploads/2022/07/ao-thun-dong-phuc-co-co-15.jpg",
    "https://dongphucphuongthao.vn/wp-content/uploads/2022/12/800x600px_lookbook-polo_8-1.jpg",
  ];

  // Handle image change on click
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const handleImageClick = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  useEffect(() => {
    // Auto-slide every 5 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  const sideVariants = {
    hidden: { x: "-100%" },
    visible: { x: "0%", transition: { type: "spring", stiffness: 100, damping: 20 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-white p-4">
      <motion.div
        className="flex w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={containerVariants}
      >
        {/* Left Section with Image */}
        <motion.div
          className="w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-12 flex flex-col justify-between relative cursor-pointer"
          variants={sideVariants}
          onClick={handleImageClick}
        >
          <img
            src={images[currentImageIndex]}
            alt="Register Background"
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-500"
          />
          <div className="z-10 relative">
            <h1 className="text-4xl font-bold">Polo Viet</h1>
            <h2 className="text-3xl font-semibold mt-2">Made In From</h2>
            <h3 className="text-xl mt-4">VIETNAM</h3>
          </div>
          
        </motion.div>

    
        <motion.div
          className="w-1/2 bg-white p-8 flex items-center justify-center"
          variants={sideVariants}
        >
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
              <span className="text-2xl font-bold text-gray-800 flex items-center">
                <svg className="w-8 h-8 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
                Polo Viet
              </span>
            </div>
            <p className="text-center text-gray-500 mb-6">Register a new account with Polo Viet! 🌟</p>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                <div className="flex space-x-2">
                  <select
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    required
                    className="w-1/3 px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Ngày</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    required
                    className="w-1/3 px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Tháng</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleChange}
                    required
                    className="w-1/3 px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Năm</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Role selection removed: defaults to CLIENT */}
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition duration-300"
              >
                Đăng ký
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-4">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-purple-600 font-medium hover:underline">
                Đăng nhập
              </a>
            </p>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Hoặc đăng ký với</p>
              <div className="flex justify-center space-x-4">
                <a href="http://localhost:8080/oauth2/authorization/google" className="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300">
                  <FaGoogle />
                </a>
                <a href="#" className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300">
                  <FaFacebookF />
                </a>
                <a href="#" className="flex items-center justify-center w-10 h-10 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition duration-300">
                  <FaTwitter />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;