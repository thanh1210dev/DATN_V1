import React, { useEffect, useRef, useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineQrcode, HiOutlineTruck, HiOutlineUser, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import Select from 'react-select';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import axiosInstance from '../../../Service/axiosInstance';

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
  showDeliveryModal,
  setShowDeliveryModal,
  provinces,
  districts,
  wards,
  deliveryForm,
  setDeliveryForm,
  handleDeliveryFormChange,
  handleAddressChange,
  createDeliveryBill,
}) => {
  // Ensure billDetails is always an array
  const safeBillDetails = billDetails || [];
  
  // State cho voucher preview
  const [previewVoucher, setPreviewVoucher] = useState(null);
  const [previewDiscount, setPreviewDiscount] = useState(0);
  
  const scannerRef = useRef(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoicePDF, setInvoicePDF] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVisitingGuestForm, setShowVisitingGuestForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerFilters, setCustomerFilters] = useState({
    phoneNumber: '',
    name: '',
    email: '',
  });
  const [customerPagination, setCustomerPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
  });
  const [visitingGuestForm, setVisitingGuestForm] = useState({
    name: '',
    phoneNumber: '',
  });
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isImageViewModalOpen, setIsImageViewModalOpen] = useState(false);
  const [selectedImagesForView, setSelectedImagesForView] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);

  // QR Scanner Effect
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

  // Generate QR Code for Banking Details
  useEffect(() => {
    if (showBankingInfo && bankingDetails) {
      const qrData = `Ngân Hàng: ${bankingDetails.bankName}\nSố Tài Khoản: ${bankingDetails.bankAccount}\nChủ Tài Khoản: ${bankingDetails.accountName}\nSố Tiền: ${(bankingDetails.amount || 0).toLocaleString()} đ`;
      QRCode.toDataURL(qrData, { width: 300, margin: 2 }, (err, url) => {
        if (err) {
          toast.error('Không thể tạo mã QR');
          return;
        }
        setQrCodeUrl(url);
      });
    }
  }, [showBankingInfo, bankingDetails]);

  // Invoice Modal Effect
  useEffect(() => {
    if (invoicePDF) {
      setShowInvoiceModal(true);
    }
  }, [invoicePDF]);

  // Fetch Customers when Modal Opens or Filters/Pagination Change
  useEffect(() => {
    if (showCustomerModal && !showVisitingGuestForm) {
      fetchCustomers();
    }
  }, [showCustomerModal, customerFilters, customerPagination.page, showVisitingGuestForm]);

  // Fetch Customer Addresses when Customer is Selected
  useEffect(() => {
    const fetchCustomerAddresses = async () => {
      if (!selectedBill?.customerId) {
        setCustomerAddresses([]);
        setSelectedAddressId(null);
        return;
      }

      const customerId = selectedBill.customerId;
      if (isNaN(customerId) || parseInt(customerId) <= 0) {
        console.log('CustomerId không hợp lệ:', customerId);
        setCustomerAddresses([]);
        setSelectedAddressId(null);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Đang lấy địa chỉ người dùng trong admin:', customerId);
        
        const response = await axiosInstance.get(`/cart-checkout/address/${customerId}`);
        const addresses = Array.isArray(response.data) ? response.data : [];
        console.log('Đã lấy được', addresses.length, 'địa chỉ');
        
        setCustomerAddresses(addresses);

        // Tìm và set địa chỉ mặc định
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setDeliveryForm(prev => ({
            ...prev,
            customerName: defaultAddress.name || prev.customerName,
            phoneNumber: defaultAddress.phoneNumber || prev.phoneNumber,
            provinceId: defaultAddress.provinceId || prev.provinceId,
            provinceName: defaultAddress.provinceName || prev.provinceName,
            districtId: defaultAddress.districtId || prev.districtId,
            districtName: defaultAddress.districtName || prev.districtName,
            wardCode: defaultAddress.wardCode || prev.wardCode,
            wardName: defaultAddress.wardName || prev.wardName,
            addressDetail: defaultAddress.address || prev.addressDetail,
            customerInformationId: defaultAddress.id
          }));
        } else {
          setSelectedAddressId(null);
          setDeliveryForm(prev => ({
            ...prev,
            customerInformationId: null
          }));
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ khách hàng:', error);
        setCustomerAddresses([]);
        setSelectedAddressId(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerAddresses();
  }, [selectedBill?.customerId, setDeliveryForm, setIsLoading]);

  // Update delivery form when customer is selected
  useEffect(() => {
    if (selectedBill && (selectedBill.customerName || selectedBill.phoneNumber)) {
      setDeliveryForm((prev) => ({
        ...prev,
        customerName: selectedBill.customerName || prev.customerName,
        phoneNumber: selectedBill.phoneNumber || prev.phoneNumber,
      }));
    }
  }, [selectedBill, setDeliveryForm]);

  // Fetch Customers banking
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/user/search/customers', {
        params: {
          phoneNumber: customerFilters.phoneNumber || null,
          name: customerFilters.name || null,
          email: customerFilters.email || null,
          page: customerPagination.page,
          size: customerPagination.size,
        },
      });
      setCustomers(response.data.content);
      setCustomerPagination((prev) => ({
        ...prev,
        totalPages: response.data.totalPages,
      }));
    } catch (error) {
      toast.error('Không thể tải danh sách khách hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Customer Filter Change
  const handleCustomerFilterChange = (e) => {
    const { name, value } = e.target;
    setCustomerFilters((prev) => ({ ...prev, [name]: value }));
    setCustomerPagination((prev) => ({ ...prev, page: 0 }));
  };

  // Handle Customer Pagination Change
  const handleCustomerPaginationChange = (page) => {
    setCustomerPagination((prev) => ({ ...prev, page }));
  };

  // Handle Visiting Guest Form Change
  const handleVisitingGuestFormChange = (e) => {
    const { name, value } = e.target;
    setVisitingGuestForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Address Selection
  const handleAddressSelection = (addressId) => {
    const selectedAddress = customerAddresses.find((addr) => addr.id === addressId);
    setSelectedAddressId(addressId);
    if (selectedAddress) {
      setDeliveryForm((prev) => ({
        ...prev,
        customerName: selectedAddress.name || prev.customerName,
        phoneNumber: selectedAddress.phoneNumber || prev.phoneNumber,
        provinceId: selectedAddress.provinceId || prev.provinceId,
        provinceName: selectedAddress.provinceName || prev.provinceName,
        districtId: selectedAddress.districtId || prev.districtId,
        districtName: selectedAddress.districtName || prev.districtName,
        wardCode: selectedAddress.wardCode || prev.wardCode,
        wardName: selectedAddress.wardName || prev.wardName,
        addressDetail: selectedAddress.address || prev.addressDetail,
        customerInformationId: selectedAddress.id
      }));
    } else {
      setDeliveryForm((prev) => ({
        ...prev,
        customerName: selectedBill?.customerName || '',
        phoneNumber: selectedBill?.phoneNumber || '',
        provinceId: null,
        provinceName: '',
        districtId: null,
        districtName: '',
        wardCode: null,
        wardName: '',
        addressDetail: '',
        customerInformationId: null
      }));
    }
  };

  // Add Loyal Customer to Bill
  const addLoyalCustomerToBill = async (customerId) => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/bills/${selectedBill.id}/assign-customer`, null, {
        params: { customerId },
      });
      setSelectedBill(response.data);
      setShowCustomerModal(false);
      setShowVisitingGuestForm(false);
      toast.success('Thêm khách hàng trung thành vào hóa đơn thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm khách hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Visiting Guest to Bill
  const addVisitingGuestToBill = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    if (!visitingGuestForm.name || !visitingGuestForm.phoneNumber) {
      toast.error('Vui lòng nhập đầy đủ tên và số điện thoại');
      return;
    }
    if (!/^\d{10}$/.test(visitingGuestForm.phoneNumber)) {
      toast.error('Số điện thoại phải có đúng 10 chữ số');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/bills/${selectedBill.id}/visiting-guests`, visitingGuestForm);
      setSelectedBill(response.data);
      setShowCustomerModal(false);
      setShowVisitingGuestForm(false);
      setVisitingGuestForm({ name: '', phoneNumber: '' });
      toast.success('Thêm khách vãng lai vào hóa đơn thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm khách vãng lai');
    } finally {
      setIsLoading(false);
    }
  };

  // Process Payment
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
      try {
        setIsLoading(true);
        const response = await processPayment();
        setSelectedBill(null);
        setCashPaid('');
        setChangeAmount(0);
        setVoucherCode('');
        setAppliedVoucher(null);
        if (response.invoicePDF) {
          setInvoicePDF(response.invoicePDF);
        }
        toast.success('Thanh toán bằng tiền mặt thành công');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể xử lý thanh toán');
      } finally {
        setIsLoading(false);
      }
    } else if (paymentType === 'BANKING') {
      setShowConfirmPaymentModal(true);
      //  const response = await processPayment();
      // if (response.invoicePDF) {
      //   setInvoicePDF(response.invoicePDF);
      // }
    }
  };

  // Confirm Banking Payment
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
      setQrCodeUrl(null);
      setShowConfirmPaymentModal(false);
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

  // Format Voucher Message
  const renderVoucherMessage = () => {
    console.log('🏷️ [CartAndPayment] renderVoucherMessage called:', {
      appliedVoucher,
      voucherCode: selectedBill?.voucherCode,
      reductionAmount: selectedBill?.reductionAmount
    });
    
    if (!appliedVoucher || !selectedBill?.voucherCode) {
      console.log('⚠️ [CartAndPayment] No voucher to display');
      return null;
    }
    
    const { code, type, percentageDiscountValue, fixedDiscountValue } = appliedVoucher;
    const discountText =
      type === 'PERCENTAGE'
        ? `${percentageDiscountValue}% (Tối đa ${(appliedVoucher.maxDiscountValue || 0).toLocaleString()} đ)`
        : `${(fixedDiscountValue || 0).toLocaleString()} đ`;
    
    // Hiển thị số tiền giảm thực tế từ selectedBill.reductionAmount
    const actualDiscountAmount = selectedBill?.reductionAmount || 0;
        
    console.log('✅ [CartAndPayment] Displaying voucher:', { code, type, discountText, actualDiscountAmount });
    
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-green-800">✅ Đã áp dụng voucher {appliedVoucher.name}</h5>
            <p className="text-xs text-green-600">
              Mã: <strong>{code}</strong> • Loại: {discountText}
            </p>
            <p className="text-sm font-bold text-green-700">
              💰 Đã giảm: {actualDiscountAmount.toLocaleString('vi-VN')} VND
            </p>
          </div>
          <button
            onClick={handleRemoveVoucher}
            className="text-red-600 hover:text-red-800 text-xs font-medium"
            disabled={isLoading}
          >
            Hủy
          </button>
        </div>
      </div>
    );
  };

  // Calculate total amount for bill
  const calculateTotalAmount = () => {
    if (!selectedBill || !safeBillDetails.length) return 0;
    return safeBillDetails.reduce((sum, detail) => sum + (detail.price * detail.quantity), 0);
  };

  // Handle select voucher with preview (không tự động áp dụng)
  const handleSelectVoucher = (voucher) => {
    const totalAmount = calculateTotalAmount();
    
    // Validate voucher conditions
    const validation = validateVoucherAgainstCart(voucher);
    if (!validation.isValid) {
      toast.error(validation.message, { position: 'top-right', autoClose: 3000 });
      return;
    }

    // Tính toán số tiền giảm preview
    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountAmount = Math.floor((totalAmount * voucher.percentageDiscountValue) / 100);
      if (voucher.maxDiscountValue && discountAmount > voucher.maxDiscountValue) {
        discountAmount = voucher.maxDiscountValue;
      }
    } else {
      discountAmount = voucher.fixedDiscountValue;
    }

    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    // Chỉ preview, không tự động áp dụng
    setPreviewVoucher(voucher);
    setPreviewDiscount(discountAmount);
    setVoucherCode(voucher.code);
    setShowSelectVoucherModal(false);
    
    toast.success(`Đã chọn voucher ${voucher.code}: Sẽ giảm ${discountAmount.toLocaleString('vi-VN')} VND`, { 
      position: 'top-right', 
      autoClose: 3000 
    });
  };

  // Validate voucher against current cart
  const validateVoucherAgainstCart = (voucher) => {
    const totalAmount = calculateTotalAmount();
    
    if (voucher.minOrderValue && totalAmount < voucher.minOrderValue) {
      return {
        isValid: false,
        message: `Đơn hàng phải có giá trị tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')} VND`
      };
    }
    
    return { isValid: true, message: '' };
  };

  // Cancel voucher preview
  const handleCancelVoucherPreview = () => {
    setPreviewVoucher(null);
    setPreviewDiscount(0);
    setVoucherCode('');
    toast.info('Đã hủy chọn voucher', { position: 'top-right', autoClose: 3000 });
  };

  // Validate applied voucher when cart changes and warn if invalid
  React.useEffect(() => {
    if (selectedBill?.voucherCode && appliedVoucher) {
      const validation = validateVoucherAgainstCart(appliedVoucher);
      if (!validation.isValid) {
        toast.warning(`Voucher không còn hợp lệ: ${validation.message}. Vui lòng hủy voucher và chọn voucher khác.`, {
          position: 'top-right',
          autoClose: 5000
        });
        // Không tự động hủy voucher, để user tự quyết định
      }
    }
    
    // Reset preview voucher khi selectedBill thay đổi
    if (!selectedBill?.voucherCode) {
      setPreviewVoucher(null);
      setPreviewDiscount(0);
    }
  }, [safeBillDetails, selectedBill?.totalMoney, appliedVoucher, selectedBill?.voucherCode]);

  // Reset voucher states when selectedBill changes
  React.useEffect(() => {
    if (!selectedBill) {
      setPreviewVoucher(null);
      setPreviewDiscount(0);
      setVoucherCode('');
      setAppliedVoucher(null);
    }
  }, [selectedBill?.id, setVoucherCode, setAppliedVoucher]);

  // Handle voucher removal
  const handleRemoveVoucher = async () => {
    if (!selectedBill || !selectedBill.voucherCode) return;
    
    try {
      setIsLoading(true);
      // Call API to remove voucher from bill
      const response = await axiosInstance.delete(`/bills/${selectedBill.id}/voucher`);
      setSelectedBill(response.data);
      setAppliedVoucher(null);
      setVoucherCode('');
      setPreviewVoucher(null);
      setPreviewDiscount(0);
      toast.success('Đã hủy voucher thành công');
    } catch (error) {
      console.error('Error removing voucher:', error);
      toast.error('Không thể hủy voucher');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {selectedBill && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-md rounded-lg p-4 md:p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Giỏ Hàng - {selectedBill.code} ({selectedBill.billType || 'COUNTER'})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlinePlus className="inline mr-1.5" size={14} />
                    Thêm Sản Phẩm
                  </button>
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlineQrcode className="inline mr-1.5" size={14} />
                    Quét QR
                  </button>
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlineUser className="inline mr-1.5" size={14} />
                    Chọn Khách Hàng
                  </button>
                  {selectedBill.customerName && (
                    <button
                      onClick={() => setShowDeliveryModal(true)}
                      className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <HiOutlineTruck className="inline mr-1.5" size={14} />
                      Giao Hàng
                    </button>
                  )}
                  <button
                    onClick={cancelBill}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlineX className="inline mr-1.5" size={14} />
                    Hủy Hóa Đơn
                  </button>
                </div>
              </div>
              <div className="mb-4 text-sm text-gray-700">
                <p><strong>Khách hàng:</strong> {selectedBill.customerName || 'Chưa có'}</p>
                <p><strong>Số điện thoại:</strong> {selectedBill.phoneNumber || 'Chưa có'}</p>
                {selectedBill.address && (
                  <>
                    <p><strong>Địa chỉ giao hàng:</strong> {selectedBill.address}</p>
                    <p><strong>Phí vận chuyển:</strong> {(selectedBill.moneyShip || 0).toLocaleString()} đ</p>
                  </>
                )}
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
                    {safeBillDetails && safeBillDetails.length > 0 ? (
                      safeBillDetails.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-indigo-50 transition-colors">
                          <td className="px-4 py-3 text-center">{index + 1}</td>
                          <td className="px-4 py-3 flex items-center space-x-3">
                            <div
                              className="relative overflow-hidden w-12 h-12 cursor-pointer"
                              onClick={() => {
                                if (item.productImage && Array.isArray(item.productImage) && item.productImage.length > 0) {
                                  setSelectedImagesForView(item.productImage);
                                  setIsImageViewModalOpen(true);
                                }
                              }}
                            >
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
                              <HiOutlineTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
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
                  <p>Phí vận chuyển: {(selectedBill.moneyShip || 0).toLocaleString()} đ</p>
                  <p className="font-semibold text-base">
                    Thành tiền: {(selectedBill.finalAmount || 0).toLocaleString()} đ
                  </p>
                  {console.log('💰 [CartAndPayment] Bill totals:', {
                    totalMoney: selectedBill.totalMoney,
                    reductionAmount: selectedBill.reductionAmount,
                    finalAmount: selectedBill.finalAmount,
                    voucherCode: selectedBill.voucherCode,
                    appliedVoucher: appliedVoucher
                  })}
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
                    { value: 'BANKING', label: 'Chuyển Khoản' }
                  ]}
                  value={{
                    value: paymentType,
                    label: paymentType === 'CASH' ? 'Tiền Mặt' : 'Chuyển Khoản',
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
                    onChange={(e) => {
                      // Lọc và làm sạch input
                      let value = e.target.value;
                      // Loại bỏ "null" ở đầu nếu có
                      value = value.replace(/^null/i, '');
                      // Chỉ cho phép chữ cái, số và một số ký tự đặc biệt
                      value = value.replace(/[^a-zA-Z0-9_-]/g, '');
                      setVoucherCode(value);
                    }}
                    placeholder="Nhập mã voucher"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => setShowSelectVoucherModal(true)}
                    className="px-2 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Chọn
                  </button>
                  {!selectedBill?.voucherCode && ( // Chỉ hiển thị nút "Áp dụng" khi chưa có voucher được áp dụng
                    <button
                      onClick={() => {
                        applyVoucher();
                        // Reset preview sau khi apply
                        setPreviewVoucher(null);
                        setPreviewDiscount(0);
                      }}
                      className="px-2 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      disabled={isLoading || !voucherCode.trim()}
                    >
                      Áp Dụng
                    </button>
                  )}
                </div>
                
                {/* Voucher Preview */}
                {previewVoucher && !selectedBill?.voucherCode && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-blue-800">{previewVoucher.name}</h5>
                        <p className="text-xs text-blue-600">
                          Mã: {previewVoucher.code} • 
                          Giảm: {previewVoucher.type === 'PERCENTAGE' 
                            ? `${previewVoucher.percentageDiscountValue}%` 
                            : `${(previewVoucher.fixedDiscountValue || 0).toLocaleString()} VND`
                          }
                          {previewVoucher.maxDiscountValue && previewVoucher.type === 'PERCENTAGE' && 
                            ` (tối đa ${(previewVoucher.maxDiscountValue || 0).toLocaleString()} VND)`
                          }
                        </p>
                        <p className="text-sm font-medium text-blue-700">
                          💰 Sẽ giảm: {previewDiscount.toLocaleString('vi-VN')} VND
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            applyVoucher();
                            // Reset preview sau khi apply
                            setPreviewVoucher(null);
                            setPreviewDiscount(0);
                          }}
                          disabled={isLoading}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Áp dụng
                        </button>
                        <button
                          onClick={handleCancelVoucherPreview}
                          className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Không hiển thị Applied Voucher Display ở phần thanh toán nữa vì bên trái đã có */}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleProcessPayment}
                  className="w-full px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Thanh Toán
                </button>
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
                <HiOutlineX size={18} />
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
                        <div
                          className="relative overflow-hidden w-12 h-12 cursor-pointer"
                          onClick={() => {
                            if (detail.images && Array.isArray(detail.images) && detail.images.length > 0) {
                              setSelectedImagesForView(detail.images);
                              setIsImageViewModalOpen(true);
                            }
                          }}
                        >
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
                          <HiOutlinePlus size={14} />
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
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePaginationChange('productDetails', pagination.productDetails.page - 1)}
                  disabled={pagination.productDetails.page === 0}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
                  Page {pagination.productDetails.page + 1} / {pagination.productDetails.totalPages}
                </span>
                <button
                  onClick={() => handlePaginationChange('productDetails', pagination.productDetails.page + 1)}
                  disabled={pagination.productDetails.page + 1 >= pagination.productDetails.totalPages}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {showVisitingGuestForm ? 'Thêm Khách Vãng Lai' : 'Chọn Khách Hàng Trung Thành'}
              </h3>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setShowVisitingGuestForm(false);
                  setVisitingGuestForm({ name: '', phoneNumber: '' });
                }}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={18} />
              </button>
            </div>
            {!showVisitingGuestForm ? (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowVisitingGuestForm(true)}
                    className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <HiOutlineUser className="inline mr-1.5" size={14} />
                    Thêm Khách Vãng Lai
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {Object.entries(customerFilters).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {key === 'phoneNumber' ? 'Số Điện Thoại' : key === 'name' ? 'Tên' : 'Email'}
                      </label>
                      <input
                        type="text"
                        name={key}
                        value={value}
                        onChange={handleCustomerFilterChange}
                        className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-500 focus:ring-gray-500"
                        placeholder={`Nhập ${key === 'phoneNumber' ? 'số điện thoại' : key === 'name' ? 'tên' : 'email'}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs uppercase bg-indigo-50 text-indigo-600">
                      <tr>
                        <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                        <th className="px-4 py-3">Mã KH</th>
                        <th className="px-4 py-3">Tên</th>
                        <th className="px-4 py-3">Số Điện Thoại</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Điểm Tích Lũy</th>
                        <th className="px-4 py-3 w-24 rounded-tr-lg">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer, index) => (
                        <tr key={customer.id} className="border-b hover:bg-indigo-50 transition-colors">
                          <td className="px-6 py-3 text-center">
                            {customerPagination.page * customerPagination.size + index + 1}
                          </td>
                          <td className="px-4 py-3">{customer.code || 'Khách Tại quầy'}</td>
                          <td className="px-4 py-3">{customer.name}</td>
                          <td className="px-4 py-3">{customer.phoneNumber}</td>
                          <td className="px-4 py-3">{customer.email || 'N/A'}</td>
                          <td className="px-4 py-3">{customer.loyaltyPoints || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => addLoyalCustomerToBill(customer.id)}
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
                    onClick={() => {
                      setShowCustomerModal(false);
                      setShowVisitingGuestForm(false);
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCustomerPaginationChange(customerPagination.page - 1)}
                      disabled={customerPagination.page === 0}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      ← Trước
                    </button>
                    <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
                      Trang {customerPagination.page + 1} / {customerPagination.totalPages}
                    </span>
                    <button
                      onClick={() => handleCustomerPaginationChange(customerPagination.page + 1)}
                      disabled={customerPagination.page + 1 >= customerPagination.totalPages}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      Tiếp →
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Khách Hàng</label>
                  <input
                    type="text"
                    name="name"
                    value={visitingGuestForm.name}
                    onChange={handleVisitingGuestFormChange}
                    placeholder="Nhập tên khách hàng"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={visitingGuestForm.phoneNumber}
                    onChange={handleVisitingGuestFormChange}
                    placeholder="Nhập số điện thoại (10 số)"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={addVisitingGuestToBill}
                    className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Thêm
                  </button>
                  <button
                    onClick={() => setShowVisitingGuestForm(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Quay Lại
                  </button>
                </div>
              </div>
            )}
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
                <HiOutlineX size={18} />
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
                    <th className="px-4 py-3">Số Tiền Giảm</th>
                    <th className="px-4 py-3 w-24 rounded-tr-lg">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher, index) => {
                    // Tính toán số tiền được giảm cho từng voucher
                    const totalAmount = calculateTotalAmount();
                    let discountAmount = 0;
                    let isEligible = true;
                    let eligibilityMessage = '';

                    // Kiểm tra điều kiện đơn hàng tối thiểu
                    if (voucher.minOrderValue && totalAmount < voucher.minOrderValue) {
                      isEligible = false;
                      eligibilityMessage = 'Chưa đủ đơn tối thiểu';
                    } else {
                      // Tính toán số tiền giảm
                      if (voucher.type === 'PERCENTAGE') {
                        discountAmount = Math.floor((totalAmount * voucher.percentageDiscountValue) / 100);
                        if (voucher.maxDiscountValue && discountAmount > voucher.maxDiscountValue) {
                          discountAmount = voucher.maxDiscountValue;
                        }
                      } else {
                        discountAmount = voucher.fixedDiscountValue;
                      }

                      // Đảm bảo không vượt quá tổng đơn hàng
                      if (discountAmount > totalAmount) {
                        discountAmount = totalAmount;
                      }
                    }

                    return (
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
                      <td className="px-4 py-3">
                        {isEligible ? (
                          <span className="text-green-600 font-medium">
                            -{discountAmount.toLocaleString()} đ
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs">
                            {eligibilityMessage}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleSelectVoucher(voucher)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          disabled={isLoading || !isEligible}
                          title={!isEligible ? eligibilityMessage : "Chọn voucher này"}
                        >
                          Chọn
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setShowSelectVoucherModal(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePaginationChange('vouchers', pagination.vouchers.page - 1)}
                  disabled={pagination.vouchers.page === 0}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  ← Trước
                </button>
                <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
                  Trang {pagination.vouchers.page + 1} / {pagination.vouchers.totalPages}
                </span>
                <button
                  onClick={() => handlePaginationChange('vouchers', pagination.vouchers.page + 1)}
                  disabled={pagination.vouchers.page + 1 >= pagination.vouchers.totalPages}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Xác Nhận Thanh Toán</h3>
              <button
                onClick={() => setShowConfirmPaymentModal(false)}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={18} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p>Bạn có muốn thanh toán hóa đơn này bằng chuyển khoản không?</p>
              <p><strong>Số tiền:</strong> {(selectedBill.finalAmount || 0).toLocaleString()} đ</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const response = await processPayment();
                    setBankingDetails(response);
                    setShowConfirmPaymentModal(false);
                    await handleConfirmBankingPayment();
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Không thể xử lý thanh toán chuyển khoản');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Xác Nhận
              </button>
              <button
                onClick={() => setShowConfirmPaymentModal(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
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
                onClick={() => {
                  setShowBankingInfo(false);
                  setQrCodeUrl(null);
                }}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={18} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Ngân Hàng:</strong> {bankingDetails.bankName}</p>
              <p><strong>Số Tài Khoản:</strong> {bankingDetails.bankAccount}</p>
              <p><strong>Chủ Tài Khoản:</strong> {bankingDetails.accountName}</p>
              <p><strong>Số Tiền:</strong> {(bankingDetails.amount || 0).toLocaleString()} đ</p>
              {qrCodeUrl && (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedImagesForView([{ url: qrCodeUrl, id: 'qr-code' }]);
                    setIsImageViewModalOpen(true);
                  }}
                >
                  <img
                    src={qrCodeUrl}
                    alt="Banking QR Code"
                    className="w-43 h-43 mx-auto mt-4"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleConfirmBankingPayment}
                className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Xác Nhận
              </button>
              <button
                onClick={() => {
                  setShowBankingInfo(false);
                  setQrCodeUrl(null);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
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
                <HiOutlineX size={18} />
              </button>
            </div>
            <div id="qr-reader" className="w-full h-64 bg-gray-100 rounded-md" ref={scannerRef}></div>
            <p className="text-sm text-gray-500 mt-2 text-center">Vui lòng đưa mã QR vào khung hình</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowQRScanner(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Thông Tin Giao Hàng</h3>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="p-1 text-gray-500 hover:bg-gray-200 rounded"
              >
                <HiOutlineX size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {customerAddresses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Địa Chỉ</label>
                  <Select
                    options={[
                      { value: null, label: 'Nhập địa chỉ mới' },
                      ...customerAddresses.map((addr) => ({
                        value: addr.id,
                        label: `${addr.name} - ${addr.address}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName} ${addr.isDefault ? '(Mặc định)' : ''}`,
                      })),
                    ]}
                    value={
                      selectedAddressId
                        ? {
                            value: selectedAddressId,
                            label: customerAddresses.find((addr) => addr.id === selectedAddressId)?.name +
                              ' - ' +
                              customerAddresses.find((addr) => addr.id === selectedAddressId)?.address +
                              ', ' +
                              customerAddresses.find((addr) => addr.id === selectedAddressId)?.wardName +
                              ', ' +
                              customerAddresses.find((addr) => addr.id === selectedAddressId)?.districtName +
                              ', ' +
                              customerAddresses.find((addr) => addr.id === selectedAddressId)?.provinceName +
                              (customerAddresses.find((addr) => addr.id === selectedAddressId)?.isDefault ? ' (Mặc định)' : ''),
                          }
                        : { value: null, label: 'Nhập địa chỉ mới' }
                    }
                    onChange={(option) => handleAddressSelection(option.value)}
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
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Khách Hàng</label>
                <input
                  type="text"
                  name="customerName"
                  value={deliveryForm.customerName}
                  onChange={handleDeliveryFormChange}
                  placeholder="Nhập tên khách hàng"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={deliveryForm.phoneNumber}
                  onChange={handleDeliveryFormChange}
                  placeholder="Nhập số điện thoại"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              {selectedAddressId === null && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành Phố</label>
                    <Select
                      options={provinces.map((province) => ({
                        value: province.ProvinceID,
                        label: province.ProvinceName,
                      }))}
                      value={provinces.find((p) => p.ProvinceID === deliveryForm.provinceId)?.ProvinceName
                        ? { value: deliveryForm.provinceId, label: provinces.find((p) => p.ProvinceID === deliveryForm.provinceId).ProvinceName }
                        : null}
                      onChange={(option) => handleAddressChange('provinceId', option.value)}
                      placeholder="Chọn tỉnh/thành phố"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                    <Select
                      options={districts.map((district) => ({
                        value: district.DistrictID,
                        label: district.DistrictName,
                      }))}
                      value={districts.find((d) => d.DistrictID === deliveryForm.districtId)?.DistrictName
                        ? { value: deliveryForm.districtId, label: districts.find((d) => d.DistrictID === deliveryForm.districtId).DistrictName }
                        : null}
                      onChange={(option) => handleAddressChange('districtId', option.value)}
                      placeholder="Chọn quận/huyện"
                      className="text-sm"
                      isDisabled={!deliveryForm.provinceId}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xã/Phường</label>
                    <Select
                      options={wards.map((ward) => ({
                        value: ward.WardCode,
                        label: ward.WardName,
                      }))}
                      value={wards.find((w) => w.WardCode === deliveryForm.wardCode)?.WardName
                        ? { value: deliveryForm.wardCode, label: wards.find((w) => w.WardCode === deliveryForm.wardCode).WardName }
                        : null}
                      onChange={(option) => handleAddressChange('wardCode', option.value)}
                      placeholder="Chọn xã/phường"
                      className="text-sm"
                      isDisabled={!deliveryForm.districtId}
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
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa Chỉ Chi Tiết</label>
                <input
                  type="text"
                  name="addressDetail"
                  value={deliveryForm.addressDetail}
                  onChange={handleDeliveryFormChange}
                  placeholder="Nhập địa chỉ chi tiết"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Giao Hàng Mong Muốn</label>
                <input
                  type="date"
                  name="desiredDate"
                  value={deliveryForm.desiredDate}
                  onChange={handleDeliveryFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={createDeliveryBill}
                className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Xác Nhận
              </button>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
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
                <HiOutlineX size={18} />
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
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Tải Xuống
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoicePDF(null);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {isImageViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Xem Hình Ảnh</h3>
            {selectedImagesForView.length > 0 ? (
              <div className="relative">
                <img
                  src={selectedImagesForView[0].url ? `http://localhost:8080${selectedImagesForView[0].url}` : selectedImagesForView[0].id === 'qr-code' ? selectedImagesForView[0].url : qrCodeUrl}
                  alt="Selected Image"
                  className="w-full h-96 object-contain rounded-lg"
                  onError={() => console.error(`Failed to load image: ${selectedImagesForView[0].url || qrCodeUrl}`)}
                />
                {selectedImagesForView.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImagesForView(prev => {
                        const newImages = [...prev];
                        newImages.unshift(newImages.pop());
                        return newImages;
                      })}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      <HiChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setSelectedImagesForView(prev => {
                        const newImages = [...prev];
                        newImages.push(newImages.shift());
                        return newImages;
                      })}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      <HiChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-full">
                      1 / {selectedImagesForView.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">Không có hình ảnh để hiển thị</p>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsImageViewModalOpen(false);
                  setSelectedImagesForView([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none transition-colors"
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

// Xác nhận thanh toán chuyển khoản thành công