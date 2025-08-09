import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';

const GuestCheckout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    provinceName: '',
    districtName: '',
    wardName: '',
    paymentType: 'COD'
  });

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/product-details/all', {
        params: { page: 0, size: 20 }
      });
      setProducts(response.data.content || []);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productDetailId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productDetailId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productDetailId: product.id,
        productName: product.product?.name || 'Sản phẩm',
        productCode: product.code,
        productImage: product.images?.[0]?.url || null,
        price: product.promotionalPrice || product.price,
        quantity: 1,
        maxQuantity: product.quantity
      }];
    });
    toast.success('Đã thêm vào giỏ hàng');
  };

  const updateQuantity = (productDetailId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.productDetailId !== productDetailId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productDetailId === productDetailId
          ? { ...item, quantity: Math.min(newQuantity, item.maxQuantity) }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleGuestInfoChange = (field, value) => {
    setGuestInfo(prev => ({ ...prev, [field]: value }));
  };

  const submitOrder = async () => {
    if (!guestInfo.name || !guestInfo.phoneNumber || !guestInfo.address) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        name: guestInfo.name,
        phoneNumber: guestInfo.phoneNumber,
        address: guestInfo.address,
        provinceName: guestInfo.provinceName,
        districtName: guestInfo.districtName,
        wardName: guestInfo.wardName,
        paymentType: guestInfo.paymentType,
        items: cart.map(item => ({
          productDetailId: item.productDetailId,
          quantity: item.quantity
        }))
      };

      const response = await axiosInstance.post('/guest-checkout/order', orderData);
      setOrderResult(response.data);
      toast.success('Đặt hàng thành công!');
      setShowOrderForm(false);
      setCart([]);
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString('vi-VN') + ' VND';
  };

  if (orderResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h2>
              <p className="text-gray-600">Mã đơn hàng: {orderResult.code}</p>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Thông tin đơn hàng</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Khách hàng:</span> {orderResult.customerName}</p>
                <p><span className="font-medium">Số điện thoại:</span> {orderResult.phoneNumber}</p>
                <p><span className="font-medium">Địa chỉ:</span> {orderResult.address}</p>
                <p><span className="font-medium">Tổng tiền:</span> {formatMoney(orderResult.finalAmount)}</p>
                <p><span className="font-medium">Phương thức thanh toán:</span> {orderResult.type === 'COD' ? 'Thanh toán khi nhận hàng' : orderResult.type}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setOrderResult(null);
                  setGuestInfo({
                    name: '', phoneNumber: '', address: '', provinceName: '', districtName: '', wardName: '', paymentType: 'COD'
                  });
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Đặt hàng tiếp
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mua hàng không cần đăng nhập</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Sản phẩm</h2>
            {loading ? (
              <div className="text-center py-8">Đang tải sản phẩm...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <img
                      src={product.images?.[0]?.url ? `http://localhost:8080${product.images[0].url}` : '/no-image.jpg'}
                      alt={product.product?.name}
                      className="w-full h-48 object-cover rounded-md mb-3"
                    />
                    <h3 className="font-medium text-gray-900 mb-1">{product.product?.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">Mã: {product.code}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      Size: {product.size?.name} | Màu: {product.color?.name}
                    </p>
                    <p className="text-lg font-bold text-indigo-600 mb-3">
                      {formatMoney(product.promotionalPrice || product.price)}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">Còn lại: {product.quantity}</p>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.quantity <= 0}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                    >
                      {product.quantity <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Giỏ hàng và form đặt hàng */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Giỏ hàng ({cart.length})</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Giỏ hàng trống</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map(item => (
                    <div key={item.productDetailId} className="flex items-center gap-3 border-b pb-3">
                      <img
                        src={item.productImage ? `http://localhost:8080${item.productImage}` : '/no-image.jpg'}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded-md"
                        onError={(e) => {
                          e.target.src = '/no-image.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.productCode}</p>
                        <p className="text-sm font-bold text-indigo-600">{formatMoney(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productDetailId, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productDetailId, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Tổng cộng:</span>
                    <span className="text-indigo-600">{formatMoney(getTotalAmount())}</span>
                  </div>
                </div>

                {!showOrderForm ? (
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Đặt hàng
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-medium">Thông tin giao hàng</h3>
                    
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={guestInfo.name}
                      onChange={(e) => handleGuestInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={guestInfo.phoneNumber}
                      onChange={(e) => handleGuestInfoChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    <textarea
                      placeholder="Địa chỉ chi tiết"
                      value={guestInfo.address}
                      onChange={(e) => handleGuestInfoChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="Tỉnh/Thành phố"
                      value={guestInfo.provinceName}
                      onChange={(e) => handleGuestInfoChange('provinceName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="Quận/Huyện"
                      value={guestInfo.districtName}
                      onChange={(e) => handleGuestInfoChange('districtName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="Phường/Xã"
                      value={guestInfo.wardName}
                      onChange={(e) => handleGuestInfoChange('wardName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <select
                      value={guestInfo.paymentType}
                      onChange={(e) => handleGuestInfoChange('paymentType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="COD">Thanh toán khi nhận hàng</option>
                      <option value="VNPAY">Thanh toán online VNPay</option>
                      <option value="BANKING">Chuyển khoản ngân hàng</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowOrderForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={submitOrder}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckout;
