import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import ProductCard from '../ProductPage/ProductCard';
import ProductService from '../../../Service/AdminProductSevice/ProductService';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import HomeService from '../../../Service/ClientHomeService/HomeService';
import axiosInstance from '../../../Service/axiosInstance';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [selectedColorId, setSelectedColorId] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [newestProducts, setNewestProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productResponse, sizesResponse, detailsResponse, newestResponse] = await Promise.all([
          ProductService.getById(id),
          ProductDetailService.getAvailableSizes(id),
          ProductDetailService.getAll(id, 0, 1),
          HomeService.getNewest(0, 8),
        ]);
        setProduct(productResponse);
        setSizes(sizesResponse);
        const firstDetail = detailsResponse.content[0];
        if (firstDetail) {
          setSelectedDetail(firstDetail);
          setSelectedSizeId(firstDetail.sizeId);
          setSelectedColorId(firstDetail.colorId);
        }
        setNewestProducts(newestResponse.content || []);
      } catch (error) {
        toast.error(error.message || 'Lỗi khi tải thông tin sản phẩm', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (sizes.length === 1) {
      setSelectedSizeId(sizes[0].id);
    } else if (sizes.length > 1 && !selectedSizeId) {
      setSelectedSizeId(sizes[0].id);
    }
  }, [sizes]);

 // Khi đổi size, luôn set selectedColorId là màu đầu tiên của size mới (nếu có)
// Khi đổi size, fetch colors và set selectedColorId là màu đầu tiên (nếu có)
useEffect(() => {
  if (selectedSizeId) {
    const fetchColors = async () => {
      try {
        const colorsResponse = await ProductDetailService.getAvailableColors(id, selectedSizeId);
        setColors(colorsResponse);

        // Luôn set selectedColorId là màu đầu tiên (nếu có)
        if (colorsResponse.length > 0) {
          setSelectedColorId(colorsResponse[0].id);
        } else {
          setSelectedColorId('');
          setSelectedDetail(null);
        }
      } catch (error) {
        toast.error(error.message || 'Lỗi khi tải màu sắc', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchColors();
  } else {
    setColors([]);
    setSelectedColorId('');
    setSelectedDetail(null);
  }
}, [selectedSizeId, id]);

// Khi selectedColorId thay đổi (và chắc chắn hợp lệ), mới fetch ProductDetail
useEffect(() => {
  if (
    selectedSizeId &&
    selectedColorId &&
    colors.length > 0 &&
    colors.some((color) => color.id === selectedColorId)
  ) {
    const fetchProductDetail = async () => {
      try {
        const detailResponse = await ProductDetailService.getProductDetailBySizeAndColor(
          id,
          selectedSizeId,
          selectedColorId
        );
        setSelectedDetail(detailResponse);
      } catch (error) {
        setSelectedDetail(null);
      }
    };
    fetchProductDetail();
  } else {
    setSelectedDetail(null);
  }
  // CHỈ theo dõi selectedColorId, selectedSizeId, colors, id
}, [selectedColorId, selectedSizeId, colors, id]);

  const handleAddToCart = async () => {
    if (!selectedDetail || selectedDetail.status !== 'AVAILABLE') {
      toast.error(
        selectedDetail?.status === 'OUT_OF_STOCK' ? 'Sản phẩm đã hết hàng!' : 'Sản phẩm không còn kinh doanh!',
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
      await axiosInstance.post(`/cart-checkout/cart/add?userId=${userId}&productDetailId=${selectedDetail.id}&quantity=1`);
      toast.success('Đã thêm vào giỏ hàng!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng', { position: 'top-right', autoClose: 3000 });
    }
  };

  if (!product) {
    return (
      <div className="p-4 sm:p-6 text-center text-gray-500 bg-white min-h-screen flex items-center justify-center w-full">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <ProductImageGallery images={selectedDetail?.images || []} />
            <ProductInfo
              product={product}
              productDetail={selectedDetail}
              sizes={sizes}
              colors={colors}
              selectedSizeId={selectedSizeId}
              setSelectedSizeId={setSelectedSizeId}
              selectedColorId={selectedColorId}
              setSelectedColorId={setSelectedColorId}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
        {/* Sản phẩm mới nhất */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm mới nhất</h2>
            <Link 
              to="/products" 
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition duration-300"
            >
              Xem thêm
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;