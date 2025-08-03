import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';

const VoucherSelector = ({ cartItems, setReductionAmount, selectedVoucher, setSelectedVoucher }) => {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState(null); // Voucher được chọn nhưng chưa áp dụng
  const [previewDiscount, setPreviewDiscount] = useState(0); // Số tiền giảm preview

  // Tính tổng tiền giỏ hàng
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  


  // Lấy danh sách voucher PRIVATE được phân cho user
  useEffect(() => {
    const fetchAvailableVouchers = async () => {
      if (cartTotal <= 0) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
          return;
        }
        
        // Sử dụng user.id trực tiếp
        const userId = user.id;
        if (!userId) {
          return;
        }

        // Lấy danh sách voucher PRIVATE được phân cho user từ backend
        const response = await axiosInstance.get(`/client/vouchers/private?userId=${userId}&orderAmount=${cartTotal}`);
        
        // Kiểm tra response.data có phải là array không
        let vouchers = [];
        if (Array.isArray(response.data)) {
          vouchers = response.data;
        } else if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          // Nếu nhận được HTML (redirect), set empty array
          vouchers = [];
        } else {
          // Nếu response.data không phải array, set empty array
          vouchers = [];
        }
        
        // Validate vouchers array
        const validVouchers = vouchers.filter(voucher => {
          if (!voucher || !voucher.id) {
            return false;
          }
          return true;
        });
        
        setAvailableVouchers(validVouchers);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách voucher:', error);
        setAvailableVouchers([]); // Set empty array on error
        // Don't show error toast if it's just network issue
        if (error.response && error.response.status !== 401) {
          console.error('API Error:', error.response.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableVouchers();
  }, [cartTotal]);

  // Chọn voucher từ danh sách (chưa áp dụng, chỉ preview)
  const handleSelectVoucher = (voucher) => {
    if (!voucher) {
      console.error('Voucher is null or undefined');
      return;
    }

    // Tính toán số tiền giảm preview
    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      const percentageValue = voucher.percentageDiscountValue || 0;
      discountAmount = Math.floor((cartTotal * percentageValue) / 100);
      if (voucher.maxDiscountValue && discountAmount > voucher.maxDiscountValue) {
        discountAmount = voucher.maxDiscountValue;
      }
    } else {
      // FIXED
      discountAmount = voucher.fixedDiscountValue || 0;
    }

    // Đảm bảo số tiền giảm không vượt quá tổng đơn hàng
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    setPreviewVoucher(voucher);
    setPreviewDiscount(discountAmount);
    setVoucherCode(voucher.code || '');
    
    toast.info(`Voucher ${voucher.code || 'N/A'}: Giảm ${discountAmount.toLocaleString('vi-VN')} VND. Click "Áp dụng" để xác nhận.`, { 
      position: 'top-right', 
      autoClose: 3000 
    });
  };
  // Áp dụng voucher (thực sự áp dụng)
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

      // Validate voucher before applying using the validation endpoint
      const validationResponse = await axiosInstance.get(`/api/client/vouchers/validate/${voucherToApply.code}?userId=${userId}&orderAmount=${cartTotal}`);
      
      if (!validationResponse.data) {
        toast.error('Voucher không thể áp dụng với đơn hàng này', { position: 'top-right', autoClose: 3000 });
        return;
      }

      // Tính toán số tiền giảm
      let discountAmount = 0;
      if (voucherToApply.type === 'PERCENTAGE') {
        discountAmount = Math.floor((cartTotal * voucherToApply.percentageDiscountValue) / 100);
        if (voucherToApply.maxDiscountValue && discountAmount > voucherToApply.maxDiscountValue) {
          discountAmount = voucherToApply.maxDiscountValue;
        }
      } else {
        // FIXED
        discountAmount = voucherToApply.fixedDiscountValue;
      }

      // Đảm bảo số tiền giảm không vượt quá tổng đơn hàng
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }

      setSelectedVoucher(voucherToApply);
      setReductionAmount(discountAmount);
      setPreviewVoucher(null);
      setPreviewDiscount(0);
      
      toast.success(`Đã áp dụng voucher ${voucherToApply.code}: Giảm ${discountAmount.toLocaleString('vi-VN')} VND`, { 
        position: 'top-right', 
        autoClose: 3000 
      });
    } catch (error) {
      console.error('Lỗi khi áp dụng voucher:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data?.error || 'Voucher không thể áp dụng với đơn hàng này', { position: 'top-right', autoClose: 3000 });
      } else {
        toast.error('Không thể áp dụng voucher. Vui lòng thử lại.', { position: 'top-right', autoClose: 3000 });
      }
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Áp dụng voucher bằng mã code
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

      // Tìm voucher theo code và kiểm tra điều kiện
      const response = await axiosInstance.get(`/api/client/vouchers/by-code/${voucherCode}?userId=${userId}&orderAmount=${cartTotal}`);
      
      if (response.data) {
        // Backend đã validate voucher, chỉ cần áp dụng trực tiếp
        const voucher = response.data;
        
        // Nếu hợp lệ, chỉ preview trước
        handleSelectVoucher(voucher);
        setVoucherCode('');
      } else {
        toast.error('Mã voucher không hợp lệ hoặc không thể sử dụng', { position: 'top-right', autoClose: 3000 });
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng voucher bằng mã:', error);
      if (error.response?.status === 404) {
        toast.error('Mã voucher không tồn tại', { position: 'top-right', autoClose: 3000 });
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Mã voucher không hợp lệ', { position: 'top-right', autoClose: 3000 });
      } else {
        toast.error('Không thể áp dụng voucher. Vui lòng thử lại.', { position: 'top-right', autoClose: 3000 });
      }
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  // Hủy voucher
  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    setReductionAmount(0);
    setPreviewVoucher(null);
    setPreviewDiscount(0);
    setVoucherCode('');
    toast.info('Đã hủy áp dụng voucher', { position: 'top-right', autoClose: 3000 });
  };

  // Hủy preview voucher
  const handleCancelPreview = () => {
    setPreviewVoucher(null);
    setPreviewDiscount(0);
    setVoucherCode('');
    toast.info('Đã hủy chọn voucher', { position: 'top-right', autoClose: 3000 });
  };

  // Format ngày
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  // Format số tiền
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '0 VND';
    }
    return price.toLocaleString('vi-VN') + ' VND';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Mã giảm giá</h3>
      
      {/* Nhập mã voucher */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Nhập mã giảm giá"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
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

      {/* Voucher đã chọn preview (chưa áp dụng) */}
      {previewVoucher && !selectedVoucher && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800">{previewVoucher.name}</h4>
              <p className="text-sm text-blue-600">
                Mã: {previewVoucher.code} • 
                Giảm: {previewVoucher.type === 'PERCENTAGE' 
                  ? `${previewVoucher.percentageDiscountValue}%` 
                  : formatPrice(previewVoucher.fixedDiscountValue)
                }
                {previewVoucher.maxDiscountValue && previewVoucher.type === 'PERCENTAGE' && 
                  ` (tối đa ${formatPrice(previewVoucher.maxDiscountValue)})`
                }
              </p>
              <p className="text-sm font-medium text-blue-700">
                Sẽ giảm: {previewDiscount.toLocaleString('vi-VN')} VND
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

      {/* Voucher đã áp dụng */}
      {selectedVoucher && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-800">✅ Đã áp dụng voucher {selectedVoucher.name}</h4>
              <p className="text-sm text-green-600">
                Mã: {selectedVoucher.code} • 
                Giảm: {selectedVoucher.type === 'PERCENTAGE' 
                  ? `${selectedVoucher.percentageDiscountValue}%` 
                  : formatPrice(selectedVoucher.fixedDiscountValue)
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

      {/* Danh sách voucher có thể sử dụng */}
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
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableVouchers.map((voucher, index) => {
                // Null checking để tránh lỗi
                if (!voucher || !voucher.id) {
                  return null;
                }
                
                return (
                <div key={voucher.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{voucher.name || 'Voucher không tên'}</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        Mã: <span className="font-mono font-medium">{voucher.code || 'N/A'}</span>
                      </p>
                      <div className="text-sm text-gray-500 mt-1">
                        <p>
                          Giảm: {voucher.type === 'PERCENTAGE' 
                            ? `${voucher.percentageDiscountValue || 0}%` 
                            : formatPrice(voucher.fixedDiscountValue || 0)
                          }
                          {voucher.maxDiscountValue && voucher.type === 'PERCENTAGE' && 
                            ` (tối đa ${formatPrice(voucher.maxDiscountValue)})`
                          }
                        </p>
                        {voucher.minOrderValue && (
                          <p>Đơn tối thiểu: {formatPrice(voucher.minOrderValue)}</p>
                        )}
                        <p>HSD: {voucher.endTime ? formatDate(voucher.endTime) : 'N/A'}</p>
                        <p>Còn lại: {voucher.quantity || 0} voucher</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectVoucher(voucher)}
                      disabled={isApplyingVoucher || previewVoucher?.id === voucher.id}
                      className="ml-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {previewVoucher?.id === voucher.id ? 'Đã chọn' : 'Chọn'}
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
