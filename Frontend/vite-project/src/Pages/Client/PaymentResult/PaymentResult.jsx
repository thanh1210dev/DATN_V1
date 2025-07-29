import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const billId = params.get('billId');
    const error = params.get('error');

    setLoading(false);

    if (status === 'success') {
      toast.success('Thanh toán VNPay thành công!', { 
        position: 'top-right', 
        autoClose: 3000 
      });
      
      // Redirect to order detail page after 2 seconds
      setTimeout(() => {
        if (billId) {
          navigate(`/order/${billId}`);
        } else {
          navigate('/profile/orders');
        }
      }, 2000);
    } else if (status === 'failed') {
      toast.error(`Thanh toán VNPay thất bại. Mã lỗi: ${error}`, { 
        position: 'top-right', 
        autoClose: 5000 
      });
      
      // Redirect to cart page so user can try payment again
      setTimeout(() => {
        navigate('/cart');
      }, 3000);
    } else if (status === 'error') {
      const message = params.get('message');
      toast.error(`Lỗi xử lý thanh toán: ${message}`, { 
        position: 'top-right', 
        autoClose: 5000 
      });
      
      // Redirect to cart page so user can try payment again
      setTimeout(() => {
        navigate('/cart');
      }, 3000);
    }
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  const params = new URLSearchParams(location.search);
  const status = params.get('status');
  const billId = params.get('billId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-6">
              Đơn hàng #{billId} đã được thanh toán thành công qua VNPay.
            </p>
            <p className="text-sm text-gray-500">Đang chuyển hướng đến trang chi tiết đơn hàng...</p>
          </>
        ) : status === 'failed' ? (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-6">
              Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
            </p>
            <p className="text-sm text-gray-500">Đang chuyển hướng về giỏ hàng để thử lại...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi xử lý</h2>
            <p className="text-gray-600 mb-6">
              Có lỗi xảy ra khi xử lý thanh toán. Vui lòng liên hệ hỗ trợ.
            </p>
            <p className="text-sm text-gray-500">Đang chuyển hướng về trang chủ...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
