import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Link } from 'react-router-dom';
const CategoryCarousel = ({ categories }) => (
  <div className="my-8 w-full">
    <Swiper
    
      spaceBetween={0}
      slidesPerView={6}
      grabCursor={true}
      style={{ width: '100%' }}
      breakpoints={{
        320: { slidesPerView: 2 },
        640: { slidesPerView: 4 },
        1024: { slidesPerView: 6 },
      }}
    >
      {categories.map((cat) => (
        <SwiperSlide key={cat.id}>
             <Link to={`/products?categoryId=${cat.id}`} className="no-underline">
        <div className="bg-white rounded-xl shadow-md p-2 hover:shadow-lg transition w-48 h-56 flex flex-col items-center">
          <img
            src={cat.imageUrl ? `http://localhost:8080${cat.imageUrl}` : '/no-image.jpg'}
            alt={cat.name}
            className="w-full h-36 object-cover rounded-lg mb-2"
            onError={e => e.target.src = '/no-image.jpg'}
          />
          <span className="text-base font-semibold text-gray-900 text-center">{cat.name}</span>
        </div>
        </Link>
      </SwiperSlide>
      ))}
    </Swiper>
  </div>
);

export default CategoryCarousel;