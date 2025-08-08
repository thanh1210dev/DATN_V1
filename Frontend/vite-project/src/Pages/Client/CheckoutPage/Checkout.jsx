import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddressSelector from './AddressSelector';
import PaymentMethod from './PaymentMethod';
import VoucherSelector from './VoucherSelector';
import OrderSummary from './OrderSummary';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';
import { redirectToVnpay, safePaymentHandler } from '../../../utils/paymentUtils';
import { getCurrentUserId } from '../../../utils/userUtils';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Lấy selectedItems từ location.state nếu có, fallback sang []
  const [selectedItems, setSelectedItems] = useState(() => (location.state && location.state.selectedItems ? location.state.selectedItems : []));
  const [cartItems, setCartItems] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    id: null,
    name: '',
    phoneNumber: '',
    address: '',
    provinceName: '',
    provinceId: '',
    districtName: '',
    districtId: '',
    wardName: '',
    wardCode: '',
    shippingFee: 0, // Sẽ được tính động
  });
  const [paymentMethod, setPaymentMethodState] = useState('COD');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  
  // Debug state changes
  const setPaymentMethod = (value) => {
    console.log('🔍 [CHECKOUT DEBUG] Setting paymentMethod from:', paymentMethod, 'to:', value);
    setPaymentMethodState(value);
  };
  const [billId, setBillId] = useState(null);
  const [step, setStep] = useState(1);
  const [reductionAmount, setReductionAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0); // Sẽ được tính động
  const [isLoading, setIsLoading] = useState(false);

  const handleContinueFromAddress = () => {
    console.log('🔍 [FRONTEND DEBUG] User clicked Continue from Address - NOT creating bill yet');
    setStep(2); // Move to payment step (skipping voucher step)
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        // Kiểm tra authentication trước khi load trang checkout
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        if (!user || !token) {
          toast.error('Vui lòng đăng nhập để thanh toán', { position: 'top-right', autoClose: 3000 });
          navigate('/login');
          return;
        }
        // Kiểm tra token còn hợp lệ không
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          if (tokenPayload.exp < currentTime) {
            toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
            AuthService.logout();
            navigate('/login');
            return;
          }
        } catch (error) {
          toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          navigate('/login');
          return;
        }
        // Nếu có selectedItems từ state thì ưu tiên, không thì lấy toàn bộ cart
        if (selectedItems && selectedItems.length > 0) {
          setCartItems(selectedItems);
        } else {
          const userId = await getCurrentUserId();
          if (!userId) {
            toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
            AuthService.logout();
            navigate('/login');
            return;
          }
          const response = await axiosInstance.get(`/cart-checkout/cart/${userId}`);
          setCartItems(response.data);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi lấy giỏ hàng', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Tính phí vận chuyển khi có địa chỉ được chọn
  useEffect(() => {
    const calculateShippingFee = async () => {
      if (!selectedAddressId || cartItems.length === 0) return;

      try {
        setIsLoading(true);
        
        // Kiểm tra authentication
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
          console.log('No auth data for shipping calculation');
          setShippingFee(22000);
          setIsLoading(false);
          return;
        }
        
        // Kiểm tra token còn hợp lệ không
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp < currentTime) {
            console.log('Token expired for shipping calculation');
            setShippingFee(22000);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log('Invalid token for shipping calculation');
          setShippingFee(22000);
          setIsLoading(false);
          return;
        }
        
        // Lấy userId từ JWT
        const userId = await getCurrentUserId();
        if (!userId) {
          console.error('Cannot convert email to userId for shipping calculation');
          setShippingFee(22000);
          setIsLoading(false);
          return;
        }
        
        console.log('Đang lấy địa chỉ để tính phí vận chuyển...');
        
        // Khai báo selectedAddress ở đây để có thể sử dụng trong toàn bộ function
        let selectedAddress = null;
        
        // Thêm timeout để đảm bảo request không bị treo
        const addressController = new AbortController();
        const addressTimeoutId = setTimeout(() => addressController.abort(), 5000);
        
        try {
          const addressesResponse = await axiosInstance.get(`/cart-checkout/address/${userId}`, {
            signal: addressController.signal,
            timeout: 5000
          });
          
          clearTimeout(addressTimeoutId);
          
          // Đảm bảo response.data là một mảng
          const addresses = Array.isArray(addressesResponse.data) ? addressesResponse.data : [];
          console.log('Đã lấy được', addresses.length, 'địa chỉ');
          
          selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
          
          if (!selectedAddress || !selectedAddress.districtId || !selectedAddress.wardCode) {
            console.warn('Địa chỉ không hợp lệ hoặc thiếu thông tin quận/huyện, phường/xã');
            setShippingFee(22000); // Dùng phí cố định khi địa chỉ không hợp lệ
            setIsLoading(false);
            return;
          }
        } catch (fetchError) {
          // Xử lý lỗi timeout hoặc network
          console.error('Lỗi khi lấy địa chỉ để tính phí vận chuyển:', fetchError);
          if (fetchError.name === 'AbortError') {
            console.log('Yêu cầu bị hủy do quá thời gian');
          }
          setShippingFee(22000);
          setIsLoading(false);
          return;
        }

        // Tính tổng khối lượng (giả sử mỗi sản phẩm 500g)
        const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);
        
        // Timeout cho API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Gọi API tính phí vận chuyển
        const response = await axiosInstance.post('/cart-checkout/calculate-shipping', {
          toDistrictId: selectedAddress.districtId,
          toWardCode: selectedAddress.wardCode,
          weight: totalWeight,
          length: 30,
          width: 20,
          height: 10
        }, {
          signal: controller.signal,
          timeout: 5000
        });
        
        clearTimeout(timeoutId);
        
        console.log('Phí vận chuyển:', response.data);
        
        // Xử lý nhiều loại response có thể có
        let fee = 22000; // Mặc định
        
        if (response.data !== null && response.data !== undefined) {
          if (typeof response.data === 'number') {
            fee = response.data;
          } else if (typeof response.data === 'string' && !isNaN(Number(response.data))) {
            fee = Number(response.data);
          } else if (typeof response.data === 'object') {
            // Trường hợp API trả về một object thay vì số trực tiếp
            if (response.data.data && response.data.data.total) {
              fee = Number(response.data.data.total);
            } else if (response.data.fee) {
              fee = Number(response.data.fee);
            }
          }
        }
        
        console.log('Phí vận chuyển cuối cùng:', fee);
        
        // Cập nhật phí vận chuyển
        setShippingFee(fee);
        
        // Cập nhật thông tin địa chỉ giao hàng
        setShippingInfo({
          ...selectedAddress,
          shippingFee: fee
        });
      } catch (error) {
        console.error('Lỗi khi tính phí vận chuyển:', error);
        // Sử dụng giá trị mặc định nếu gặp lỗi
        setShippingFee(22000);
      } finally {
        setIsLoading(false);
      }
    };

    calculateShippingFee();
  }, [selectedAddressId, cartItems]);

  // Cleanup effect để xử lý khi user thoát khỏi checkout
  useEffect(() => {
    // Cleanup function khi component unmount
    return () => {
      // Nếu không phải đang trong quá trình VNPAY, có thể xóa flag
      const isVnpayFlow = sessionStorage.getItem('vnpayProcessing') === 'true';
      
      // Chỉ xóa flag nếu user thực sự thoát khỏi checkout
      // mà không phải do chuyển hướng sang VNPAY
      if (!isVnpayFlow) {
        console.log('Cleaning up checkout session');
      }
    };
  }, []);

  const handleCreateBill = async () => {
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn hoặc thêm địa chỉ giao hàng', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống, không thể tạo hóa đơn', { position: 'top-right', autoClose: 3000 });
      navigate('/cart');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Kiểm tra authentication
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      if (!user || !token) {
        toast.error('Vui lòng đăng nhập để tiếp tục', { position: 'top-right', autoClose: 3000 });
        navigate('/login');
        return;
      }
      
      // Lấy userId từ JWT
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
      
      // Kiểm tra token còn hợp lệ không
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenPayload.exp < currentTime) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          navigate('/login');
          return;
        }
      } catch (error) {
        toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
      
      // Thêm xử lý lỗi và timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15s timeout
      
      console.log('🔍 [FRONTEND DEBUG] Đang tạo bill với paymentMethod:', paymentMethod);
      console.log('🔍 [FRONTEND DEBUG] paymentMethod type:', typeof paymentMethod);
      console.log('🔍 [FRONTEND DEBUG] paymentMethod === "VNPAY"?', paymentMethod === 'VNPAY');
      console.log('🔍 [FRONTEND DEBUG] paymentMethod === "COD"?', paymentMethod === 'COD');
      console.log('🔍 [FRONTEND DEBUG] Đang gửi yêu cầu tạo hóa đơn với:', {
        userId,
        addressId: selectedAddressId,
        paymentType: paymentMethod,
        voucherId: selectedVoucher?.id || null
      });
      console.log('🔍 [FRONTEND DEBUG] selectedVoucher full object:', selectedVoucher);
      console.log('🔍 [FRONTEND DEBUG] userId type:', typeof userId, ', voucherId type:', typeof selectedVoucher?.id);
      
      // Chuẩn bị danh sách id các cart item được chọn (ưu tiên selectedItems nếu có)
      const selectedCartDetailIds = (selectedItems && selectedItems.length > 0 ? selectedItems : cartItems).map(item => item.id);

      // Tạo URL với các tham số được mã hóa đúng cách
      let url = `/cart-checkout/create-bill-from-selected?userId=${encodeURIComponent(userId)}&addressId=${encodeURIComponent(selectedAddressId)}&paymentType=${encodeURIComponent(paymentMethod)}`;
      // Thêm voucherId nếu có
      if (selectedVoucher && selectedVoucher.id) {
        url += `&voucherId=${encodeURIComponent(selectedVoucher.id)}`;
      }
      // Thêm selectedCartDetailIds (dạng: &selectedCartDetailIds=1&selectedCartDetailIds=2)
      selectedCartDetailIds.forEach(id => {
        url += `&selectedCartDetailIds=${encodeURIComponent(id)}`;
      });

      console.log('🔍 [FRONTEND DEBUG] Final URL being sent:', url);

      const response = await axiosInstance.post(
        url,
        {}, // empty body
        {
          signal: controller.signal,
          timeout: 15000, // 15s timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      // Kiểm tra response
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      if (!response.data.id) {
        throw new Error('Dữ liệu hóa đơn không hợp lệ');
      }
      
      setBillId(response.data.id);
      setReductionAmount(response.data.reductionAmount || 0);
      setShippingFee(response.data.moneyShip || shippingFee); // Sử dụng giá trị từ server hoặc giá trị đã tính
      
      toast.success(
        response.data.reductionAmount > 0
          ? `Tạo hóa đơn thành công! Voucher giảm ${response.data.reductionAmount.toLocaleString('vi-VN')} VND đã được áp dụng.`
          : 'Tạo hóa đơn thành công!',
        { position: 'top-right', autoClose: 3000 }
      );
      
      setStep(2);
      return response.data.id;
    } catch (error) {
      console.error('Lỗi khi tạo hóa đơn:', error);
      
      // Thông báo lỗi cụ thể hơn
      if (error.name === 'AbortError') {
        toast.error('Yêu cầu tạo hóa đơn bị hủy do quá thời gian. Vui lòng thử lại.', { position: 'top-right', autoClose: 5000 });
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Lỗi khi tạo hóa đơn. Vui lòng kiểm tra thông tin và thử lại.';
        toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
      } else {
        toast.error('Không thể tạo hóa đơn. Vui lòng thử lại sau.', { position: 'top-right', autoClose: 5000 });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    // Ngăn chặn hành vi mặc định của sự kiện (nếu có)
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Kiểm tra và bảo vệ khỏi sự kiện không hợp lệ
    if (e && e.target && typeof e.target.className === 'object') {
      console.warn('className không phải là string, đang xử lý...');
      // Fix lỗi className không phải string
      if (e.target.className.baseVal !== undefined) {
        // SVG elements có className.baseVal
        e.target.className = e.target.className.baseVal || '';
      } else {
        // Các trường hợp khác
        e.target.className = '';
      }
    }
    
    // Kiểm tra tồn kho trước khi đặt hàng
    try {
      // Kiểm tra authentication
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      if (!user || !token) {
        toast.error('Vui lòng đăng nhập để tiếp tục', { position: 'top-right', autoClose: 3000 });
        navigate('/login');
        return;
      }
      
      // Kiểm tra token còn hợp lệ không
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenPayload.exp < currentTime) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          navigate('/login');
          return;
        }
      } catch (error) {
        toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
      
      const userId = user.id;
      if (!userId) {
        toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
      
      // Lấy cart mới nhất để kiểm tra tồn kho
      const cartResponse = await axiosInstance.get(`/cart-checkout/cart/${userId}`);
      const currentCart = cartResponse.data;
      
      // Kiểm tra từng sản phẩm trong giỏ hàng
      for (const item of currentCart) {
        if (item.quantity > item.availableQuantity) {
          toast.error(`Sản phẩm "${item.productName}" chỉ còn ${item.availableQuantity} trong kho, nhưng bạn đang chọn ${item.quantity}. Vui lòng cập nhật giỏ hàng.`, { 
            position: 'top-right', 
            autoClose: 5000 
          });
          return;
        }
      }
      
      // Cập nhật cartItems state với dữ liệu mới nhất
      setCartItems(currentCart);
    } catch (error) {
      console.error('Lỗi khi kiểm tra tồn kho:', error);
      toast.error('Không thể kiểm tra tồn kho. Vui lòng thử lại.', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    // Tiếp tục xử lý bình thường
    let currentBillId = billId;
    if (!currentBillId) {
      setIsLoading(true);
      console.log('🔍 [FRONTEND DEBUG] Trong handlePlaceOrder - paymentMethod hiện tại là:', paymentMethod);
      console.log('🔍 [FRONTEND DEBUG] paymentMethod type:', typeof paymentMethod);
      console.log('🔍 [FRONTEND DEBUG] paymentMethod === "VNPAY"?', paymentMethod === 'VNPAY');
      console.log('🔍 [FRONTEND DEBUG] paymentMethod === "COD"?', paymentMethod === 'COD');
      currentBillId = await handleCreateBill();
      setIsLoading(false);
      if (!currentBillId) return;
    }

    try {
      setIsLoading(true);
      const amount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + shippingFee - reductionAmount;
      
      // Thêm xử lý lỗi và timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10s timeout
      
      // Log để debug
      console.log('🔍 [FRONTEND DEBUG] Gửi request process-payment:');
      console.log(`🔍 [FRONTEND DEBUG] billId=${currentBillId}, paymentType=${paymentMethod}, amount=${amount}`);
      
      const response = await axiosInstance.post(
        `/cart-checkout/process-payment/${currentBillId}?paymentType=${paymentMethod}`, 
        {}, // empty body
        {
          signal: controller.signal,
          timeout: 10000 // 10s timeout
        }
      );
      
      clearTimeout(timeoutId);
      console.log('Nhận response từ server:', response.data);

      if (paymentMethod === 'VNPAY') {
        // Backend trả về URL thanh toán trực tiếp (string)
        if (response.data) {
          console.log('Đang chuyển hướng đến VNPay với URL:', response.data);
          
          // Đánh dấu đang trong quá trình thanh toán VNPAY
          sessionStorage.setItem('vnpayProcessing', 'true');
          sessionStorage.setItem('vnpayBillId', currentBillId.toString());
          
          // Sử dụng hàm chuyển hướng an toàn
          const redirectSuccess = redirectToVnpay(response.data);
          
          if (!redirectSuccess) {
            // Nếu chuyển hướng thất bại, xóa flag
            sessionStorage.removeItem('vnpayProcessing');
            sessionStorage.removeItem('vnpayBillId');
            toast.error('Không thể chuyển hướng đến trang thanh toán. Vui lòng thử lại sau.', { position: 'top-right', autoClose: 5000 });
          }
        } else {
          throw new Error('Không nhận được URL thanh toán');
        }
      } else {
        // COD: Không gọi confirm-payment nữa, chuyển luôn sang trang chi tiết đơn hàng
        toast.success('Đặt hàng thành công!', { position: 'top-right', autoClose: 3000 });
        navigate(`/order/${currentBillId}`);
      }
    } catch (error) {
      console.error('Lỗi khi thanh toán:', error);
      
      // Thông báo lỗi cụ thể hơn
      if (error.name === 'AbortError') {
        toast.error('Yêu cầu thanh toán bị hủy do quá thời gian. Vui lòng thử lại.', { position: 'top-right', autoClose: 5000 });
      } else {
        toast.error(error.response?.data?.message || 'Lỗi khi thanh toán. Vui lòng thử lại sau.', { position: 'top-right', autoClose: 3000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
              <span className="inline-block w-8 h-8 rounded-full border-2 border-indigo-600 text-center leading-8">{step > 1 ? '✓' : '1'}</span>
              <p className="mt-2 text-sm">Thông tin giao hàng</p>
            </div>
            <div className="flex-1 h-1 bg-gray-200">
              <div className={`h-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>
              <span className="inline-block w-8 h-8 rounded-full border-2 border-indigo-600 text-center leading-8">{step > 2 ? '✓' : '2'}</span>
              <p className="mt-2 text-sm">Phương thức thanh toán</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <AddressSelector
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                setShippingInfo={setShippingInfo}
                onNext={handleContinueFromAddress}
              />
            )}
            {step === 2 && (
              <div className="space-y-6">
                <VoucherSelector
                  cartItems={cartItems}
                  setReductionAmount={setReductionAmount}
                  selectedVoucher={selectedVoucher}
                  setSelectedVoucher={setSelectedVoucher}
                />
                <PaymentMethod
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />
              </div>
            )}
          </div>
          <OrderSummary
            cartItems={selectedItems && selectedItems.length > 0 ? selectedItems : cartItems}
            shippingFee={shippingFee}
            reductionAmount={reductionAmount}
            onPlaceOrder={handlePlaceOrder}
            step={step}
            selectedAddressId={selectedAddressId}
            paymentMethod={paymentMethod}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
