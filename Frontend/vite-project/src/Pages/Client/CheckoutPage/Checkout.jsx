import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddressSelector from './AddressSelector';
import PaymentMethod from './PaymentMethod';
import OrderSummary from './OrderSummary';
import axiosInstance from '../../../Service/axiosInstance';

const Checkout = () => {
  const navigate = useNavigate();
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
    shippingFee: 22000, // Fixed shipping fee
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [billId, setBillId] = useState(null);
  const [step, setStep] = useState(1);
  const [reductionAmount, setReductionAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(22000); // Fixed shipping fee

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Vui lòng đăng nhập để thanh toán', { position: 'top-right', autoClose: 3000 });
          navigate('/login');
          return;
        }
        const response = await axiosInstance.get(`/cart-checkout/cart/${userId}`);
        setCartItems(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi lấy giỏ hàng', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchCart();
  }, [navigate]);

  const handleCreateBill = async () => {
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn hoặc thêm địa chỉ giao hàng', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const userId = localStorage.getItem('userId');
      const response = await axiosInstance.post(
        `/cart-checkout/create-bill?userId=${userId}&addressId=${selectedAddressId}&paymentType=${paymentMethod}`
      );
      setBillId(response.data.id);
      setReductionAmount(response.data.reductionAmount || 0);
      setShippingFee(response.data.moneyShip || 22000); // Use backend value, should be 22000
      toast.success(
        response.data.reductionAmount > 0
          ? `Tạo hóa đơn thành công! Voucher giảm ${response.data.reductionAmount.toLocaleString('vi-VN')} VND đã được áp dụng.`
          : 'Tạo hóa đơn thành công!',
        { position: 'top-right', autoClose: 3000 }
      );
      setStep(2);
      return response.data.id;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo hóa đơn', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handlePlaceOrder = async () => {
    let currentBillId = billId;
    if (!currentBillId) {
      currentBillId = await handleCreateBill();
      if (!currentBillId) return;
    }

    try {
      const amount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + shippingFee - reductionAmount;
      const response = await axiosInstance.post(
        `/cart-checkout/process-payment/${currentBillId}?paymentType=${paymentMethod}&amount=${amount}`
      );

      if (paymentMethod === 'BANKING' || paymentMethod === 'VNPAY') {
        window.location.href = response.data.paymentUrl;
      } else {
        // COD: Không gọi confirm-payment nữa, chuyển luôn sang trang chi tiết đơn hàng
        toast.success('Đặt hàng thành công!', { position: 'top-right', autoClose: 3000 });
        navigate(`/order/${currentBillId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thanh toán', { position: 'top-right', autoClose: 3000 });
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
                onNext={handleCreateBill}
              />
            )}
            {step === 2 && (
              <PaymentMethod
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
              />
            )}
          </div>
          <OrderSummary
            cartItems={cartItems}
            shippingFee={shippingFee}
            reductionAmount={reductionAmount}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
