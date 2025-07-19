import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';

const ProductCard = ({ product, isNew }) => {
  const [productDetail, setProductDetail] = useState(null);
  const [allProductDetails, setAllProductDetails] = useState([]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        // Lấy tất cả chi tiết sản phẩm
        const response = await axiosInstance.get(`/product-details/all/${product.id}?page=0&size=100`);
        const details = response.data.content || [];
        setAllProductDetails(details);
        
        // Tìm chi tiết có giá khuyến mãi tốt nhất (giá thấp nhất)
        let bestDetail = null;
        let lowestPrice = Infinity;
        
        details.forEach(detail => {
          const currentPrice = detail.promotionalPrice || detail.price;
          if (currentPrice < lowestPrice) {
            lowestPrice = currentPrice;
            bestDetail = detail;
          }
        });
        
        setProductDetail(bestDetail || details[0] || null);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProductDetail();
  }, [product.id]);

  const handleAddToCart = async () => {
    if (!productDetail || productDetail.status !== 'AVAILABLE') {
      toast.error(
        productDetail?.status === 'OUT_OF_STOCK' ? 'Sản phẩm đã hết hàng!' : 'Sản phẩm không còn kinh doanh!',
        { position: 'top-right', autoClose: 3000 }
      );
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', { position: 'top-right', autoClose: 3000 });
        return;
      }
      await axiosInstance.post(`/cart-checkout/cart/add?userId=${userId}&productDetailId=${productDetail.id}&quantity=1`);
      toast.success('Đã thêm vào giỏ hàng!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng', { position: 'top-right', autoClose: 3000 });
    }
  };

  const calculateSavings = () => {
    if (!productDetail?.promotionalPrice || !productDetail?.price) return 0;
    return productDetail.price - productDetail.promotionalPrice;
  };

  // Tính toán khoảng giá nếu có nhiều chi tiết
  const getPriceRange = () => {
    if (allProductDetails.length <= 1) return null;
    
    const prices = allProductDetails
      .filter(detail => detail.status === 'AVAILABLE')
      .map(detail => detail.promotionalPrice || detail.price);
    
    if (prices.length === 0) return null;
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return { minPrice, maxPrice };
  };

  const priceRange = getPriceRange();

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      {isNew && (
        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-20">
          NEW
        </span>
      )}
      {calculateSavings() > 0 && (
        <div className="absolute top-2 right-2 bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded z-10">
          Tiết kiệm {calculateSavings().toLocaleString('vi-VN')}₫
        </div>
      )}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
        <img
          src={
            productDetail?.images?.[0]?.url
              ? `http://localhost:8080${productDetail.images[0].url}`
              : '/no-image.jpg'
          }
          alt={product.name}
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="p-3">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
        </Link>
        <div className="flex gap-2 mt-2 items-center">
          {priceRange ? (
            // Hiển thị khoảng giá nếu có nhiều chi tiết
            <span className="text-red-600 font-semibold text-sm">
              {priceRange.minPrice.toLocaleString('vi-VN')}₫ - {priceRange.maxPrice.toLocaleString('vi-VN')}₫
            </span>
          ) : productDetail?.promotionalPrice ? (
            // Hiển thị giá khuyến mãi nếu chỉ có 1 chi tiết
            <>
              <span className="text-red-600 font-semibold text-sm">
                {productDetail.promotionalPrice.toLocaleString('vi-VN')}₫
              </span>
              <span className="line-through text-gray-400 text-xs">
                {productDetail.price.toLocaleString('vi-VN')}₫
              </span>
            </>
          ) : (
            // Hiển thị giá gốc
            <span className="text-red-600 font-semibold text-sm">
              {(productDetail?.price || 100000).toLocaleString('vi-VN')}₫
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;