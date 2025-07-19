import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Banner from './Banner';
import HomeService from '../../../Service/ClientHomeService/HomeService';
import CategoryService from '../../../Service/AdminProductSevice/CategoryService';
import ProductCard from '../ProductPage/ProductCard';
import CategoryCarousel from './CategoryCarousel';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const HomeClient = () => {
  const [categories, setCategories] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [promotionProducts, setPromotionProducts] = useState([]);
  const [newestProducts, setNewestProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await CategoryService.getAll(0, 100);
        setCategories(categoriesResponse.content || []);
        const bestSellerRes = await HomeService.getBestSeller(0, 10);
        setBestSellerProducts(bestSellerRes.content || []);
        const promotionRes = await HomeService.getSale(0, 10);
        setPromotionProducts(promotionRes.content || []);
        const newestRes = await HomeService.getNewest(0, 10);
        setNewestProducts(newestRes.content || []);
      } catch (error) {
        toast.error(error.message || 'Lỗi khi lấy dữ liệu', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Banner />
      <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8 text-center">Danh Mục Sản Phẩm</h2>
      <div className="max-w-7xl mx-auto w-full flex justify-center">
        <CategoryCarousel categories={categories} />
      </div>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {/* Sản phẩm bán chạy */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản phẩm bán chạy</h2>
          <Swiper
            spaceBetween={16}
            slidesPerView={4}
            grabCursor={true}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
          >
            {bestSellerProducts.length === 0 ? (
              <SwiperSlide>
                <div className="col-span-full text-center text-gray-500 text-lg">Không có sản phẩm</div>
              </SwiperSlide>
            ) : (
              bestSellerProducts.slice(0, 10).map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div>
        {/* Sản phẩm khuyến mãi */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản phẩm khuyến mãi</h2>
          <Swiper
            spaceBetween={16}
            slidesPerView={4}
            grabCursor={true}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
          >
            {promotionProducts.length === 0 ? (
              <SwiperSlide>
                <div className="col-span-full text-center text-gray-500 text-lg">Không có sản phẩm</div>
              </SwiperSlide>
            ) : (
              promotionProducts.slice(0, 10).map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div>
        {/* Sản phẩm mới nhất */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản phẩm mới nhất</h2>
          <Swiper
            spaceBetween={16}
            slidesPerView={4}
            grabCursor={true}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
          >
            {newestProducts.length === 0 ? (
              <SwiperSlide>
                <div className="col-span-full text-center text-gray-500 text-lg">Không có sản phẩm</div>
              </SwiperSlide>
            ) : (
              newestProducts.slice(0, 10).map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} isNew={true}/>
                </SwiperSlide>
              ))
            )}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default HomeClient;