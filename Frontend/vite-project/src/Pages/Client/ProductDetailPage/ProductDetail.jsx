import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import ProductCard from '../ProductPage/ProductCard';
import ProductService from '../../../Service/AdminProductSevice/ProductService';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import HomeService from '../../../Service/ClientHomeService/HomeService';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';
import { getUserIdByEmail } from '../../../utils/userUtils';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const handleAddToCart = async (quantity = 1) => {
    if (!selectedDetail || selectedDetail.status !== 'AVAILABLE') {
      toast.error(
        selectedDetail?.status === 'OUT_OF_STOCK' ? 'Sản phẩm đã hết hàng!' : 'Sản phẩm không còn kinh doanh!',
        { position: 'top-right', autoClose: 3000 }
      );
      return;
    }

    if (quantity > selectedDetail.quantity) {
      toast.error(`Chỉ còn ${selectedDetail.quantity} sản phẩm trong kho!`, { 
        position: 'top-right', 
        autoClose: 3000 
      });
      return;
    }

    try {
      // Kiểm tra authentication trước khi thêm vào giỏ hàng
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      console.log('🔍 [ADD TO CART] Debug info:');
      console.log('User:', user);
      console.log('Token exists:', !!token);
      console.log('User ID:', user?.id);
      console.log('Selected detail:', selectedDetail);
      console.log('Quantity:', quantity);
      
      // Guest flow: nếu chưa đăng nhập -> lưu giỏ hàng vào localStorage
      if (!user || !token) {
        console.log('🔍 [ADD TO CART] Guest mode - storing cart in localStorage');
        // Tên, màu, size, ảnh, giá, tồn kho từ các state hiện có
        const colorName = (colors || []).find(c => c.id === selectedColorId)?.name || selectedDetail?.color?.name || '';
        const sizeName = (sizes || []).find(s => s.id === selectedSizeId)?.name || selectedDetail?.size?.name || '';
        const productName = (product && product.name) || selectedDetail?.product?.name || 'Sản phẩm';
        const price = selectedDetail?.promotionalPrice || selectedDetail?.price || 0;
        const availableQuantity = selectedDetail?.quantity || 0;
        // Lấy ảnh đầu tiên nếu có
        let imageUrl = null;
        try {
          if (selectedDetail?.images && selectedDetail.images.length > 0) {
            imageUrl = selectedDetail.images[0].url || selectedDetail.images[0];
          } else if (product?.images && product.images.length > 0) {
            imageUrl = product.images[0].url || product.images[0];
          }
        } catch (e) {
          imageUrl = null;
        }

        const guestItem = {
          id: `guest-${selectedDetail.id}`,
          productDetailId: selectedDetail.id,
          productName,
          productColor: colorName,
          productSize: sizeName,
          images: imageUrl ? [{ url: imageUrl }] : [],
          price: Number(price) || 0,
          availableQuantity,
          quantity: Math.min(quantity, availableQuantity)
        };

        const raw = localStorage.getItem('guest_cart');
        const list = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
        const idx = list.findIndex(it => it.productDetailId === guestItem.productDetailId);
        if (idx >= 0) {
          const newQty = Math.min((list[idx].quantity || 0) + guestItem.quantity, list[idx].availableQuantity || guestItem.availableQuantity || 0);
          list[idx] = { ...list[idx], quantity: newQty };
        } else {
          list.push(guestItem);
        }
        localStorage.setItem('guest_cart', JSON.stringify(list));
        toast.success(`Đã thêm ${guestItem.quantity} sản phẩm vào giỏ hàng!`, { position: 'top-right', autoClose: 3000 });
        return;
      }
      
      // Kiểm tra token còn hợp lệ không
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        console.log('🔍 [ADD TO CART] Token payload:', tokenPayload);
        console.log('🔍 [ADD TO CART] Token exp:', tokenPayload.exp);
        console.log('🔍 [ADD TO CART] Current time:', currentTime);
        console.log('🔍 [ADD TO CART] Token valid:', tokenPayload.exp > currentTime);
        console.log('🔍 [ADD TO CART] Token sub (subject):', tokenPayload.sub);
        console.log('🔍 [ADD TO CART] Token role:', tokenPayload.role);
        console.log('🔍 [ADD TO CART] All token properties:', Object.keys(tokenPayload));
        
        if (tokenPayload.exp < currentTime) {
          console.log('🔍 [ADD TO CART] Token expired');
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          return;
        }
      } catch (error) {
        console.log('🔍 [ADD TO CART] Invalid token:', error);
        toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        return;
      }
      
      let userId = user.id;
      console.log('🔍 [ADD TO CART] Initial userId:', userId);
      console.log('🔍 [ADD TO CART] typeof userId:', typeof userId);
      
      // Nếu userId là email (string), lấy user ID số thật từ utility function
      if (typeof userId === 'string' && userId.includes('@')) {
        console.log('🔍 [ADD TO CART] userId is email, getting numeric ID...');
        try {
          userId = await getUserIdByEmail(userId);
          console.log('🔍 [ADD TO CART] Got numeric userId:', userId);
        } catch (error) {
          console.log('🔍 [ADD TO CART] Failed to get numeric userId:', error.message);
          toast.error('Không thể xác định thông tin người dùng, vui lòng thử lại', { position: 'top-right', autoClose: 3000 });
          return;
        }
      }
      
      if (!userId || userId === 'null' || userId === 'undefined') {
        console.log('🔍 [ADD TO CART] No valid userId found');
        toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        return;
      }
      
      const apiUrl = `/cart-checkout/cart/add?userId=${userId}&productDetailId=${selectedDetail.id}&quantity=${quantity}`;
      console.log('🔍 [ADD TO CART] API URL:', apiUrl);
      
      const response = await axiosInstance.post(apiUrl);
      console.log('🔍 [ADD TO CART] API Response:', response.data);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`, { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('🔍 [ADD TO CART] Error:', error);
      console.error('🔍 [ADD TO CART] Error response:', error.response?.data);
      console.error('🔍 [ADD TO CART] Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleBuyNow = async (quantity = 1) => {
    if (!selectedDetail || selectedDetail.status !== 'AVAILABLE') {
      toast.error(
        selectedDetail?.status === 'OUT_OF_STOCK' ? 'Sản phẩm đã hết hàng!' : 'Sản phẩm không còn kinh doanh!',
        { position: 'top-right', autoClose: 3000 }
      );
      return;
    }

    if (quantity > selectedDetail.quantity) {
      toast.error(`Chỉ còn ${selectedDetail.quantity} sản phẩm trong kho!`, { 
        position: 'top-right', 
        autoClose: 3000 
      });
      return;
    }

    try {
      // Kiểm tra authentication trước khi mua hàng
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      console.log('🔍 [BUY NOW] Debug info:');
      console.log('User:', user);
      console.log('Token exists:', !!token);
      console.log('User ID:', user?.id);
      
      if (!user || !token) {
        // Guest flow: thêm vào guest_cart và chuyển đến giỏ hàng
        console.log('🔍 [BUY NOW] Guest mode - add to localStorage and go to cart');
        const colorName = (colors || []).find(c => c.id === selectedColorId)?.name || selectedDetail?.color?.name || '';
        const sizeName = (sizes || []).find(s => s.id === selectedSizeId)?.name || selectedDetail?.size?.name || '';
        const productName = (product && product.name) || selectedDetail?.product?.name || 'Sản phẩm';
        const price = selectedDetail?.promotionalPrice || selectedDetail?.price || 0;
        const availableQuantity = selectedDetail?.quantity || 0;
        let imageUrl = null;
        try {
          if (selectedDetail?.images && selectedDetail.images.length > 0) {
            imageUrl = selectedDetail.images[0].url || selectedDetail.images[0];
          } else if (product?.images && product.images.length > 0) {
            imageUrl = product.images[0].url || product.images[0];
          }
        } catch (e) {
          imageUrl = null;
        }

        const guestItem = {
          id: `guest-${selectedDetail.id}`,
          productDetailId: selectedDetail.id,
          productName,
          productColor: colorName,
          productSize: sizeName,
          images: imageUrl ? [{ url: imageUrl }] : [],
          price: Number(price) || 0,
          availableQuantity,
          quantity: Math.min(quantity, availableQuantity)
        };

        const raw = localStorage.getItem('guest_cart');
        const list = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
        const idx = list.findIndex(it => it.productDetailId === guestItem.productDetailId);
        if (idx >= 0) {
          const newQty = Math.min((list[idx].quantity || 0) + guestItem.quantity, list[idx].availableQuantity || guestItem.availableQuantity || 0);
          list[idx] = { ...list[idx], quantity: newQty };
        } else {
          list.push(guestItem);
        }
        localStorage.setItem('guest_cart', JSON.stringify(list));
        toast.success(`Đã thêm ${guestItem.quantity} sản phẩm vào giỏ hàng!`, { position: 'top-right', autoClose: 3000 });
        navigate('/cart');
        return;
      }
      
      // Kiểm tra token còn hợp lệ không
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenPayload.exp < currentTime) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          return;
        }
      } catch (error) {
        toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        return;
      }
      
      const userId = user.id;
      if (!userId) {
        toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        return;
      }
      
  // Thêm sản phẩm vào giỏ hàng trước
      await axiosInstance.post(`/cart-checkout/cart/add?userId=${userId}&productDetailId=${selectedDetail.id}&quantity=${quantity}`);
      
      // Chuyển đến trang giỏ hàng
      navigate('/cart');
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`, { position: 'top-right', autoClose: 3000 });
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
              onBuyNow={handleBuyNow}
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