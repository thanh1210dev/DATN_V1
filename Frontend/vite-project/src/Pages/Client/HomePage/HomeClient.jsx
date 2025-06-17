import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Banner from "./Banner";
import CategorySection from "./CategorySection";
import FeaturedProducts from "./FeaturedProducts";
import ProductService from "../../../Service/AdminProductSevice/ProductService";


const HomeClient = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await ProductService.getAll(0, 8); // Lấy 8 sản phẩm nổi bật
        setFeaturedProducts(response.content || []);
      } catch (error) {
        toast.error(error, { position: "top-right", autoClose: 3000 });
      }
    };
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer />
      <Banner />
      <CategorySection />
      <FeaturedProducts products={featuredProducts} />
    </div>
  );
};

export default HomeClient;