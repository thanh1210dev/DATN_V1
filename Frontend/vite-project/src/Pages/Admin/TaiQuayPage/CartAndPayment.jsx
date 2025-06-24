import React, { useEffect, useRef, useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineQrcode } from 'react-icons/hi';
import Select from 'react-select';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';

const CartAndPayment = ({
  selectedBill,
  billDetails,
  productDetails,
  vouchers,
  voucherCode,
  setVoucherCode,
  paymentType,
  setPaymentType,
  cashPaid,
  setCashPaid,
  changeAmount,
  setChangeAmount,
  isLoading,
  setIsLoading,
  showAddProductModal,
  setShowAddProductModal,
  showSelectVoucherModal,
  setShowSelectVoucherModal,
  showBankingInfo,
  setShowBankingInfo,
  showQRScanner,
  setShowQRScanner,
  bankingDetails,
  setBankingDetails,
  pagination,
  filters,
  productQuantities,
  handlePaginationChange,
  handleFilterChange,
  handleQuantityChange,
  addProductToBill,
  updateQuantity,
  deleteBillDetail,
  applyVoucher,
  processPayment,
  confirmBankingPayment,
  cancelBill,
  handleQRScan,
  appliedVoucher,
  setAppliedVoucher,
  setSelectedBill,
}) => {
  const scannerRef = useRef(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoicePDF, setInvoicePDF] = useState(null);

  useEffect(() => {
    if (showQRScanner && scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          if (!decodedText) {
            toast.error('Mã QR không hợp lệ');
            return;
          }
          handleQRScan(decodedText);
          scanner.clear().catch((err) => console.warn('Failed to clear scanner:', err));
          setShowQRScanner(false);
        },
        (error) => {
          console.warn('QR scan error:', error);
          if (error.message.includes('Could not establish connection')) {
            console.debug('Ignoring runtime.lastError for QR scanner');
          }
        }
      );
      return () => {
        scanner.clear().catch((err) => console.error('Failed to clear scanner:', err));
      };
    }
  }, [showQRScanner, handleQRScan, setShowQRScanner]);

  useEffect(() => {
    if (invoicePDF) {
      setShowInvoiceModal(true);
    }
  }, [invoicePDF]);

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    const finalAmount = selectedBill.finalAmount || 0;
    if (paymentType === 'CASH') {
      const amount = parseFloat(cashPaid);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Số tiền phải là số dương');
        return;
      }
      if (amount < finalAmount) {
        toast.error('Số tiền phải lớn hơn hoặc bằng tổng thanh toán');
        return;
      }
      if (amount > 999999999999999.99) {
        toast.error('Số tiền vượt quá giới hạn cho phép');
        return;
      }
    }
    try {
      setIsLoading(true);
      const response = await processPayment();
      setSelectedBill(response.bill || null);
      if (paymentType === 'BANKING') {
        setBankingDetails(response);
        setShowBankingInfo(true);
        if (response.invoicePDF) {
          setInvoicePDF(response.invoicePDF);
        }
      } else {
        toast.success('Thanh toán thành công');
        setSelectedBill(null);
        setCashPaid('');
        setChangeAmount(0);
        setVoucherCode('');
        setAppliedVoucher(null);
        if (response.invoicePDF) {
          setInvoicePDF(response.invoicePDF);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm banking payment
  const handleConfirmBankingPayment = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    try {
      setIsLoading(true);
      const response = await confirmBankingPayment();
      setSelectedBill(null);
      setBankingDetails(null);
      setShowBankingInfo(false);
      setVoucherCode('');
      setAppliedVoucher(null);
      toast.success('Xác nhận thanh toán chuyển khoản thành công');
      if (response.invoicePDF) {
        setInvoicePDF(response.invoicePDF);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = () => {
    if (invoicePDF) {
      const byteCharacters = atob(invoicePDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${selectedBill?.code || 'bill'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Format voucher message
  const renderVoucherMessage = () => {
    if (!appliedVoucher || !selectedBill?.voucherCode) return null;
    const { code, type, percentageDiscountValue, fixedDiscountValue } = appliedVoucher;
    const discountText =
      type === 'PERCENTAGE'
        ? `${percentageDiscountValue}% (Tối đa ${(appliedVoucher.maxDiscountValue || 0).toLocaleString()} đ)`
        : `${(fixedDiscountValue || 0).toLocaleString()} đ`;
    return (
      <p className="text-sm text-green-600 mt-2">
        Đã áp dụng voucher <strong>{code}</strong>: Giảm {discountText}
      </p>
    );
  };

  return (
    <>
      {selectedBill && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-4 md:p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Giỏ Hàng - {selectedBill.code}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlinePlus className="inline mr-2" size={16} />
                    Thêm Sản Phẩm
                  </button>
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlineQrcode className="inline mr-2" size={16} />
                    Quét QR
                  </button>
                  <button
                    onClick={cancelBill}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlineX className="inline mr-2" size={16} />
                    Hủy Hóa Đơn
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs uppercase bg-indigo-50 text-indigo-700">
                    <tr>
                      <th className="px-16 py-3 w-16 rounded-tl-lg">#</th>
                      <th className="px-4 py-3">Sản Phẩm</th>
                      <th className="px-4 py-3">Mã SP</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Màu</th>
                      <th className="px-4 py-3">Số Lượng</th>
                      <th className="px-4 py-3">Đơn Giá</th>
                      <th className="px-4 py-3">Tổng</th>
                      <th className="px-4 py-3 w-24 rounded-tr-lg">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billDetails.length > 0 ? (
                      billDetails.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-indigo-50 transition-colors">
                          <td className="px-4 py-3 text-center">{index + 1}</td>
                          <td className="px-4 py-3 flex items-center space-x-3">
                            <div className="relative overflow-hidden w-12 h-12">
                              {item.productImage && Array.isArray(item.productImage) && item.productImage.length > 0 ? (
                                <div
                                  className="image-carousel-inner"
                                  style={{
                                    width: `${item.productImage.length * 48}px`,
                                    animation: item.productImage.length > 1 ? `slide-${item.id} 10s infinite` : 'none',
                                  }}
                                >
                                  {item.productImage.map((img) => (
                                    <img
                                      key={img.id}
                                      src={`http://localhost:8080${img.url}`}
                                      alt={`Image ${img.id}`}
                                      className="w-12 h-12 object-cover rounded-md"
                                      onError={() => console.error(`Failed to load image: http://localhost:8080${img.url}`)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                              {item.productImage && Array.isArray(item.productImage) && item.productImage.length > 1 && (
                                <style>
                                  {`
                                    @keyframes slide-${item.id} {
                                      ${Array.from({ length: item.productImage.length }, (_, i) => `
                                        ${(i * 100) / item.productImage.length}% { transform: translateX(-${i * 48}px); }
                                        ${((i + 1) * 100) / item.productImage.length}% { transform: translateX(-${i * 48}px); }
                                      `).join('')}
                                    }
                                  `}
                                </style>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.productDetailCode || item.code}</td>
                          <td className="px-4 py-3">{item.productSize || 'N/A'}</td>
                          <td className="px-4 py-3">{item.productColor || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                                disabled={isLoading || item.quantity <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center border rounded-md px-2 py-1 text-sm"
                                min="1"
                              />
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                                disabled={isLoading}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {(item.promotionalPrice || item.price || 0).toLocaleString()} đ
                          </td>
                          <td className="px-4 py-3">{(item.totalPrice || 0).toLocaleString()} đ</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => deleteBillDetail(item.id)}
                              className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                              disabled={isLoading}
                            >
                              <HiOutlineTrash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-4 py-4 text-center text-gray-500">
                          Chưa có sản phẩm trong giỏ hàng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <div className="text-right space-y-1 text-sm">
                  <p>Tổng tiền hàng: {(selectedBill.totalMoney || 0).toLocaleString()} đ</p>
                  <p>Giảm giá: {(selectedBill.reductionAmount || 0).toLocaleString()} đ</p>
                  <p className="font-semibold text-base">
                    Thành tiền: {(selectedBill.finalAmount || 0).toLocaleString()} đ
                  </p>
                  {renderVoucherMessage()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white shadow-md rounded-lg p-4 md:p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thanh Toán</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương Thức Thanh Toán</label>
                <Select
                  options={[
                    { value: 'CASH', label: 'Tiền Mặt' },
                    { value: 'BANKING', label: 'Chuyển Khoản' },
                    { value: 'VNPAY', label: 'VNPay' },
                  ]}
                  value={{
                    value: paymentType,
                    label: paymentType === 'CASH' ? 'Tiền Mặt' : paymentType === 'BANKING' ? 'Chuyển Khoản' : 'VNPay',
                  }}
                  onChange={(option) => setPaymentType(option.value)}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#d1d5db',
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#6366f1' },
                    }),
                  }}
                />
              </div>
              {paymentType === 'CASH' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiền Khách Trả</label>
                    <input
                      type="number"
                      value={cashPaid}
                      onChange={(e) => setCashPaid(e.target.value)}
                      placeholder="Nhập số tiền"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiền Thừa</label>
                    <input
                      type="text"
                      value={(changeAmount >= 0 ? changeAmount : 0).toLocaleString()}
                      readOnly
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Nhập mã voucher"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => setShowSelectVoucherModal(true)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Chọn
                  </button>
                  <button
                    onClick={applyVoucher}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleProcessPayment}
                  className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Thanh Toán
                </button>
                {paymentType === 'BANKING' && selectedBill.status === 'PENDING' && (
                  <button
                    onClick={handleConfirmBankingPayment}
                    className="w-full px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Xác Nhận Chuyển Khoản
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Thêm Sản Phẩm</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
              {Object.entries(filters).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {key === 'code'
                      ? 'Mã SP'
                      : key === 'name'
                      ? 'Tên SP'
                      : key === 'sizeName'
                      ? 'Kích Cỡ'
                      : key === 'colorName'
                      ? 'Màu Sắc'
                      : key === 'minPrice'
                      ? 'Giá Tối Thiểu'
                      : 'Giá Tối Đa'}
                  </label>
                  <input
                    type={key.includes('Price') ? 'number' : 'text'}
                    name={key}
                    value={value}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-500 focus:ring-gray-500"
                    placeholder={`Nhập ${key.includes('Price') ? 'giá trị' : key}`}
                    min={key.includes('Price') ? '0' : undefined}
                  />
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs uppercase bg-indigo-50 text-indigo-600">
                  <tr>
                    <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                    <th className="px-4 py-3">Sản Phẩm</th>
                    <th className="px-4 py-3">Mã SP</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Màu</th>
                    <th className="px-4 py-3">Số Lượng</th>
                    <th className="px-4 py-3">Số Lượng Tồn</th>
                    <th className="px-4 py-3">Giá</th>
                    <th className="px-4 py-3">Giá KM</th>
                    <th className="px-4 py-3 w-24 rounded-tr-lg">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.map((detail, index) => (
                    <tr key={detail.id} className="border-b hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-3 text-center">
                        {pagination.productDetails.page * pagination.productDetails.size + index + 1}
                      </td>
                      <td className="px-4 py-3 flex items-center space-x-3">
                        <div className="relative overflow-hidden w-12 h-12">
                          {detail.images && Array.isArray(detail.images) && detail.images.length > 0 ? (
                            <div
                              className="image-carousel-inner"
                              style={{
                                width: `${detail.images.length * 48}px`,
                                animation: detail.images.length > 1 ? `slide-${detail.id} 10s infinite` : 'none',
                              }}
                            >
                              {detail.images.map((img) => (
                                <img
                                  key={img.id}
                                  src={`http://localhost:8080${img.url}`}
                                  alt={`Image ${detail.id}`}
                                  className="w-12 h-12 object-cover rounded-md"
                                  onError={() => console.error(`Failed to load image: http://localhost:8080${img.url}`)}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                          {detail.images && Array.isArray(detail.images) && detail.images.length > 1 && (
                            <style>
                              {`
                                @keyframes slide-${detail.id} {
                                  ${Array.from({ length: detail.images.length }, (_, i) => `
                                    ${(i * 100) / detail.images.length}% { transform: translateX(-${i * 48}px); }
                                    ${((i + 1) * 100) / detail.images.length}% { transform: translateX(-${i * 48}px); }
                                  `).join('')}
                                }
                              `}
                            </style>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{detail.productName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{detail.code}</td>
                      <td className="px-4 py-3">{detail.sizeName || 'N/A'}</td>
                      <td className="px-4 py-3">{detail.colorName || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={productQuantities[detail.id] || 1}
                          onChange={(e) => handleQuantityChange(detail.id, e.target.value)}
                          className="w-20 text-center border rounded-md px-2 py-1 text-sm"
                          min="1"
                          max={detail.quantity}
                        />
                      </td>
                      <td className="px-4 py-3">{detail.quantity}</td>
                      <td className="px-4 py-3">{(detail.price || 0).toLocaleString()} đ</td>
                      <td className="px-4 py-3">{(detail.promotionalPrice || 0).toLocaleString()} đ</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => addProductToBill(detail.id, productQuantities[detail.id] || 1)}
                          className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <HiOutlinePlus size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePaginationChange('productDetails', pagination.productDetails.page - 1)}
                  disabled={pagination.productDetails.page === 0}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
                  Page {pagination.productDetails.page + 1} / {pagination.productDetails.totalPages}
                </span>
                <button
                  onClick={() => handlePaginationChange('productDetails', pagination.productDetails.page + 1)}
                  disabled={pagination.productDetails.page + 1 >= pagination.productDetails.totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Voucher Modal */}
      {showSelectVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Chọn Voucher</h3>
              <button
                onClick={() => setShowSelectVoucherModal(false)}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs uppercase bg-indigo-50 text-indigo-600">
                  <tr>
                    <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3">Giá Trị</th>
                    <th className="px-4 py-3">Đơn Tối Thiểu</th>
                    <th className="px-4 py-3 w-24 rounded-tr-lg">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher, index) => (
                    <tr key={voucher.id} className="border-b hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-3 text-center">
                        {pagination.vouchers.page * pagination.vouchers.size + index + 1}
                      </td>
                      <td className="px-4 py-3">{voucher.code}</td>
                      <td className="px-4 py-3">{voucher.name}</td>
                      <td className="px-4 py-3">
                        {voucher.type === 'PERCENTAGE'
                          ? `${voucher.percentageDiscountValue}% (Max ${(voucher.maxDiscountValue || 0).toLocaleString()} đ)`
                          : `${(voucher.fixedDiscountValue || 0).toLocaleString()} đ`}
                      </td>
                      <td className="px-4 py-3">{(voucher.minOrderValue || 0).toLocaleString()} đ</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setVoucherCode(voucher.code);
                            setShowSelectVoucherModal(false);
                            applyVoucher();
                          }}
                          className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          disabled={isLoading}
                        >
                          Chọn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setShowSelectVoucherModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePaginationChange('vouchers', pagination.vouchers.page - 1)}
                  disabled={pagination.vouchers.page === 0}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
                  Trang {pagination.vouchers.page + 1} / {pagination.vouchers.totalPages}
                </span>
                <button
                  onClick={() => handlePaginationChange('vouchers', pagination.vouchers.page + 1)}
                  disabled={pagination.vouchers.page + 1 >= pagination.vouchers.totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banking Info Modal */}
      {showBankingInfo && bankingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Thông Tin Chuyển Khoản</h3>
              <button
                onClick={() => setShowBankingInfo(false)}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Ngân Hàng:</strong> {bankingDetails.bankName}</p>
              <p><strong>Số Tài Khoản:</strong> {bankingDetails.bankAccount}</p>
              <p><strong>Chủ Tài Khoản:</strong> {bankingDetails.accountName}</p>
              <p><strong>Số Tiền:</strong> {(bankingDetails.amount || 0).toLocaleString()} đ</p>
              {bankingDetails.qrCode && (
                <img
                  src={`http://localhost:8080${bankingDetails.qrCode}`}
                  alt="QR Code"
                  className="w-32 h-32 mx-auto mt-4"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleConfirmBankingPayment}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Xác Nhận
              </button>
              <button
                onClick={() => setShowBankingInfo(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Quét Mã QR Sản Phẩm</h3>
              <button
                onClick={() => setShowQRScanner(false)}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div id="qr-reader" className="w-full h-64 bg-gray-100 rounded-md" ref={scannerRef}></div>
            <p className="text-sm text-gray-500 mt-2 text-center">Vui lòng đưa mã QR vào khung hình</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowQRScanner(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice PDF Modal */}
      {showInvoiceModal && invoicePDF && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Hóa Đơn</h3>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoicePDF(null);
                }}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div className="w-full h-[70vh]">
              <embed
                src={`data:application/pdf;base64,${invoicePDF}`}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Tải Xuống
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoicePDF(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartAndPayment;



//Tạo hóa đơn