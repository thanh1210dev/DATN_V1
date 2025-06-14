import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebookF, FaTwitter } from "react-icons/fa";

function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  
  const images = [
    "https://2.bp.blogspot.com/-yvcnu-W-hvw/XjvvDTTD47I/AAAAAAAARGo/T-EO0HXUsyEO_iohJMPl4GNePl1v8t37ACLcBGAsYHQ/s1600/Ao-thun-Polo-nam-Burberry-Ha-Noi-TPHCM-hang-hieu-sieu-cap-mau-trang-dep-co-co-be-co-Big-Size-lon-cho-nguoi-to-beo-map-fake-1-chinh-hang-ship-toan-Viet-Nam-2.jpg",
    "https://dongphuchaianh.vn/wp-content/uploads/2022/07/ao-thun-dong-phuc-co-co-15.jpg",
    "https://dongphucphuongthao.vn/wp-content/uploads/2022/12/800x600px_lookbook-polo_8-1.jpg",
  ];

 
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

  const getRedirectPathByRole = (role) => {
    switch (role) {
      case "Staff":
      case "ADMIN":
        return "/dashboard";
      case "CLIENT":
      default:
        return "/";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8080/api/user/login", {
        identifier,
        password,
      });

      const { token, name, id, role } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("name", name);
      localStorage.setItem("id", id);
      localStorage.setItem("selectedRole", role);

      console.log("JWT Token:", token);
      console.log("ID:", id);
      console.log("Role:", role);

      const redirectPath = getRedirectPathByRole(role);
      navigate(redirectPath);
    } catch (error) {
      const errData = error?.response?.data;
      if (typeof errData === "string") {
        toast.error(errData);
      } else {
        toast.error("Đã có lỗi xảy ra!");
      }
    }
  };

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

        <motion.div
          className="w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-12 flex flex-col justify-between relative cursor-pointer"
          variants={sideVariants}
          onClick={handleImageClick}
        >
          <img
            src={images[currentImageIndex]}
            alt="Login Background"
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
            <p className="text-center text-gray-500 mb-6">Welcome to Sneat! 🌟 Please sign in to your account and start the adventure</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email or Username</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <a href="#" className="text-sm text-purple-600 hover:underline mt-1 block text-right">Forgot Password?</a>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input type="checkbox" id="remember" className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-700">Remember Me</label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition duration-300"
              >
                Sign In
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-4">
              New on our platform?{" "}
              <a href="/register" className="text-purple-600 font-medium hover:underline">
                Create an account
              </a>
            </p>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Or sign in with</p>
              <div className="flex justify-center space-x-4">
                <a href="http://localhost:8080/oauth2/authorize/google?redirect_uri=http://localhost:3000/oauth2/redirect" className="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300">
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

export default LoginPage;