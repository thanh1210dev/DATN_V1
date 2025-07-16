import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import ProductService from '../../../Service/AdminProductSevice/ProductService';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import axiosInstance from '../../../Service/axiosInstance';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [selectedColorId, setSelectedColorId] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productResponse, sizesResponse, detailsResponse] = await Promise.all([
          ProductService.getById(id),
          ProductDetailService.getAvailableSizes(id),
          ProductDetailService.getAll(id, 0, 1),
        ]);
        setProduct(productResponse);
        setSizes(sizesResponse);
        const firstDetail = detailsResponse.content[0];
        if (firstDetail) {
          setSelectedDetail(firstDetail);
          setSelectedSizeId(firstDetail.sizeId);
          setSelectedColorId(firstDetail.colorId);
        }
      } catch (error) {
        toast.error(error.message || 'Lỗi khi tải thông tin sản phẩm', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (selectedSizeId) {
      const fetchColors = async () => {
        try {
          const colorsResponse = await ProductDetailService.getAvailableColors(id, selectedSizeId);
          setColors(colorsResponse);
          if (!colorsResponse.some((color) => color.id === selectedColorId)) {
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
  }, [selectedSizeId, id, selectedColorId]);

  useEffect(() => {
    if (selectedSizeId && selectedColorId) {
      const fetchProductDetail = async () => {
        try {
          const detailResponse = await ProductDetailService.getProductDetailBySizeAndColor(id, selectedSizeId, selectedColorId);
          setSelectedDetail(detailResponse);
        } catch (error) {
          toast.error(error.message || 'Lỗi khi tải chi tiết sản phẩm', { position: 'top-right', autoClose: 3000 });
        }
      };
      fetchProductDetail();
    }
  }, [selectedSizeId, selectedColorId, id]);

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
    <div className="p-4 sm:p-6 bg-white min-h-screen w-full">
      <ToastContainer />
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
    </div>
  );
};

export default ProductDetail;