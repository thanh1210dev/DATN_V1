import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Banner = () => {
  const slides = [
    {
      image: "https://polomanor.vn/cdn/shop/files/NewDiamond-Collection-PC.webp?v=1747206054&width=2000",
      link: "/products/diamond-collection",
    },
    {
      image: "https://polomanor.vn/cdn/shop/files/sanhdoi-collection-pc.webp?v=1740992791&width=2000",
      link: "/products/sanhdoi-collection",
    },
    {
      image: "https://polomanor.vn/cdn/shop/files/slider-tnrp_pc.webp?v=1744700260&width=2000",
      link: "/products/tnrp-collection",
    },
    {
      image: "https://polomanor.vn/cdn/shop/files/summer-manor-collection-pc.webp?v=1749184680&width=2000",
      link: "/products/summer-manor-collection",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4000); // Increased to 4s for smoother feel
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {slides.map((slide, index) => (
        <Link
          key={index}
          to={slide.link}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center transform scale-100 hover:scale-105 transition-transform duration-5000"
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          />
        </Link>
      ))}
    </div>
  );
};

export default Banner;