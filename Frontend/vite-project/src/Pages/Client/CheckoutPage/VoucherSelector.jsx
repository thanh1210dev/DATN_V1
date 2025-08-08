import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';

const VoucherSelector = ({ cartItems, setReductionAmount, selectedVoucher, setSelectedVoucher }) => {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState(null);
  const [previewDiscount, setPreviewDiscount] = useState(0);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const fetchPrivateVouchers = async () => {
      try {
        setIsLoading(true);
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        if (!user || !token) return;
        const userId = user.id;
        if (!userId) return;
        const response = await axiosInstance.get(`/client/vouchers/private?userId=${userId}`);
        const vouchers = Array.isArray(response.data) ? response.data : [];
        setAvailableVouchers(vouchers);
      } catch (error) {
        setAvailableVouchers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrivateVouchers();
  }, []);

  const handleSelectVoucher = (voucher) => {
    if (!voucher) return;
    // Chuẩn hóa lấy thông tin voucher
    const name = voucher.voucherName || voucher.name || 'Không xác định';
    const code = voucher.voucherCode || voucher.code || 'N/A';
    const type = voucher.voucherType || voucher.type || '';
    const percentageValue = voucher.percentageDiscountValue || 0;
    const fixedValue = voucher.fixedDiscountValue || 0;
    const maxDiscountValue = voucher.maxDiscountValue || 0;
    let discountAmount = 0;
    if (type === 'PERCENTAGE') {
      discountAmount = Math.floor((cartTotal * percentageValue) / 100);
      if (maxDiscountValue && discountAmount > maxDiscountValue) {
        discountAmount = maxDiscountValue;
      }
    } else if (type === 'FIXED') {
      discountAmount = fixedValue;
    }
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }
    setPreviewVoucher({ ...voucher, name, code, type });
    setPreviewDiscount(discountAmount);
    setVoucherCode(code);
    toast.info(`Voucher ${code}: Giảm ${discountAmount > 0 ? discountAmount.toLocaleString('vi-VN') : 'Không xác định'} VND. Click "Áp dụng" để xác nhận.`, { 
      position: 'top-right', 
      autoClose: 3000 
    });
  };

  const handleApplyVoucher = async (voucher = null) => {
  const voucherToApply = voucher || previewVoucher;
  
  if (!voucherToApply) {
    toast.error('Vui lòng chọn voucher trước khi áp dụng', { position: 'top-right', autoClose: 3000 });
    return;
  }
  try {
    setIsApplyingVoucher(true);
    const user = AuthService.getCurrentUser();
    const userId = user.id;
    if (!userId) {
      toast.error('Vui lòng đăng nhập để sử dụng voucher', { position: 'top-right', autoClose: 3000 });
      return;
    }
    const code = voucherToApply.voucherCode || voucherToApply.code;
    const validationResponse = await axiosInstance.get(`/client/vouchers/private/validate?userId=${userId}&code=${code}&orderAmount=${cartTotal}`);
    if (!validationResponse.data) {
      toast.error('Voucher không thể áp dụng với đơn hàng này', { position: 'top-right', autoClose: 3000 });
      return;
    }
    const validVoucher = validationResponse.data;
    // Chuẩn hóa lấy thông tin voucher
    const name = validVoucher.voucherName || validVoucher.name || 'Không xác định';
    const codeShow = validVoucher.voucherCode || validVoucher.code || 'N/A';
    const type = validVoucher.voucherType || validVoucher.type || '';
    const percentageValue = validVoucher.percentageDiscountValue || 0;
    const fixedValue = validVoucher.fixedDiscountValue || 0;
    const maxDiscountValue = validVoucher.maxDiscountValue || 0;
    let discountAmount = 0;
    if (type === 'PERCENTAGE') {
      discountAmount = Math.floor((cartTotal * percentageValue) / 100);
      if (maxDiscountValue && discountAmount > maxDiscountValue) {
        discountAmount = maxDiscountValue;
      }
    } else if (type === 'FIXED') {
      discountAmount = fixedValue;
    }
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }
    
    // SỬA ĐÂY: Sử dụng voucherId thay vì id
    const actualVoucherId = validVoucher.voucherId || validVoucher.id;
    setSelectedVoucher({ 
      ...validVoucher, 
      id: actualVoucherId, // Set id thành voucher ID thực
      name, 
      code: codeShow, 
      type 
    });
    console.log('🔍 [VOUCHER DEBUG] Selected voucher set to:', { 
      ...validVoucher, 
      id: actualVoucherId, 
      name, 
      code: codeShow, 
      type 
    });
    console.log('🔍 [VOUCHER DEBUG] Actual voucher ID being used:', actualVoucherId);
    
    setReductionAmount(discountAmount);
    setPreviewVoucher(null);
    setPreviewDiscount(0);
    toast.success(`Đã áp dụng voucher ${codeShow}: Giảm ${discountAmount > 0 ? discountAmount.toLocaleString('vi-VN') : 'Không xác định'} VND`, { 
      position: 'top-right', 
      autoClose: 3000 
    });
  } catch (error) {
    if (error.response?.status === 400) {
      toast.error(error.response.data?.error || 'Voucher không thể áp dụng với đơn hàng này', { position: 'top-right', autoClose: 3000 });
    } else {
      toast.error('Không thể áp dụng voucher. Vui lòng thử lại.', { position: 'top-right', autoClose: 3000 });
    }
  } finally {
    setIsApplyingVoucher(false);
  }
};

  const handleApplyVoucherByCode = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã voucher', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      setIsApplyingVoucher(true);
      const user = AuthService.getCurrentUser();
      const userId = user.id;
      if (!userId) {
        toast.error('Vui lòng đăng nhập để sử dụng voucher', { position: 'top-right', autoClose: 3000 });
        return;
      }
      const response = await axiosInstance.get(`/client/vouchers/private/by-code?userId=${userId}&code=${voucherCode}`);
      if (response.data) {
        const voucher = response.data;
        handleSelectVoucher(voucher);
        setVoucherCode('');
      } else {
        toast.error('Mã voucher không hợp lệ hoặc không thể sử dụng', { position: 'top-right', autoClose: 3000 });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Mã voucher không tồn tại', { position: 'top-right', autoClose: 3000 });
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.error || 'Mã voucher không hợp lệ', { position: 'top-right', autoClose: 3000 });
      } else {
        toast.error('Không thể áp dụng voucher. Vui lòng thử lại.', { position: 'top-right', autoClose: 3000 });
      }
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    setReductionAmount(0);
    setPreviewVoucher(null);
    setPreviewDiscount(0);
    setVoucherCode('');
    toast.info('Đã hủy áp dụng voucher', { position: 'top-right', autoClose: 3000 });
  };

  const handleCancelPreview = () => {
    setPreviewVoucher(null);
    setPreviewDiscount(0);
    setVoucherCode('');
    toast.info('Đã hủy chọn voucher', { position: 'top-right', autoClose: 3000 });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '0 VND';
    return price.toLocaleString('vi-VN') + ' VND';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mã giảm giá</h3>
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Nhập mã giảm giá"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isApplyingVoucher || selectedVoucher}
          />
          <button
            onClick={handleApplyVoucherByCode}
            disabled={isApplyingVoucher || selectedVoucher || !voucherCode.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplyingVoucher ? 'Đang kiểm tra...' : 'Kiểm tra'}
          </button>
        </div>
      </div>

      {previewVoucher && !selectedVoucher && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800">{previewVoucher.name || 'Không xác định'}</h4>
              <p className="text-sm text-blue-600">
                Mã: {previewVoucher.code || 'N/A'} • 
                Giảm: {previewVoucher.type === 'PERCENTAGE' 
                  ? `${previewVoucher.percentageDiscountValue || 0}%` 
                  : formatPrice(previewVoucher.fixedDiscountValue || 0)
                }
                {previewVoucher.maxDiscountValue && previewVoucher.type === 'PERCENTAGE' && 
                  ` (tối đa ${formatPrice(previewVoucher.maxDiscountValue)})`
                }
              </p>
              <p className="text-sm font-medium text-blue-700">
                Sẽ giảm: {previewDiscount > 0 ? previewDiscount.toLocaleString('vi-VN') + ' VND' : 'Không xác định'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleApplyVoucher()}
                disabled={isApplyingVoucher}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplyingVoucher ? '...' : 'Áp dụng'}
              </button>
              <button
                onClick={handleCancelPreview}
                className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVoucher && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-800">✅ Đã áp dụng voucher {selectedVoucher.name || 'Không xác định'}</h4>
              <p className="text-sm text-green-600">
                Mã: {selectedVoucher.code || 'N/A'} • 
                Giảm: {selectedVoucher.type === 'PERCENTAGE' 
                  ? `${selectedVoucher.percentageDiscountValue || 0}%` 
                  : formatPrice(selectedVoucher.fixedDiscountValue || 0)
                }
                {selectedVoucher.maxDiscountValue && selectedVoucher.type === 'PERCENTAGE' && 
                  ` (tối đa ${formatPrice(selectedVoucher.maxDiscountValue)})`
                }
              </p>
            </div>
            <button
              onClick={handleRemoveVoucher}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {!selectedVoucher && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Voucher có thể sử dụng</h4>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Đang tải voucher...</p>
            </div>
          ) : availableVouchers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Không có voucher nào có thể sử dụng</p>
              <p className="text-xs text-gray-400 mt-1">Debug: cartTotal = {cartTotal}, vouchers = {availableVouchers.length}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">Debug: Hiển thị {availableVouchers.length} voucher(s)</p>
              {availableVouchers.map((voucher, index) => {
                if (!voucher || !(voucher.id || voucher.voucherId)) {
                  return null;
                }
                return (
                  <div key={voucher.id || voucher.voucherId} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{voucher.voucherName || voucher.name || 'Voucher không tên'}</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          Mã: <span className="font-mono font-medium">{voucher.voucherCode || voucher.code || 'N/A'}</span>
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>
                            Giảm: {(voucher.voucherType === 'PERCENTAGE' || voucher.type === 'PERCENTAGE')
                              ? `${voucher.percentageDiscountValue || 0}%`
                              : formatPrice(voucher.fixedDiscountValue || 0)
                            }
                            {(voucher.maxDiscountValue && (voucher.voucherType === 'PERCENTAGE' || voucher.type === 'PERCENTAGE')) &&
                              ` (tối đa ${formatPrice(voucher.maxDiscountValue)})`
                            }
                          </p>
                          {(voucher.minOrderValue) && (
                            <p>Đơn tối thiểu: {formatPrice(voucher.minOrderValue)}</p>
                          )}
                          <p>HSD: {voucher.endTime ? formatDate(voucher.endTime) : 'N/A'}</p>
                          <p>Còn lại: {voucher.quantity || 0} voucher</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectVoucher(voucher)}
                        disabled={isApplyingVoucher || previewVoucher?.id === (voucher.id || voucher.voucherId)}
                        className="ml-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {previewVoucher?.id === (voucher.id || voucher.voucherId) ? 'Đã chọn' : 'Chọn'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoucherSelector;
