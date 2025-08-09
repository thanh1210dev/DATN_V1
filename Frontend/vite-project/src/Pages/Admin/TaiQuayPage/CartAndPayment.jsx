import React, { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineTruck, HiOutlineUser, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import Select from 'react-select';
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
  // showQRScanner,
  // setShowQRScanner,
  bankingDetails,
  setBankingDetails,
  pagination,
  filters,
  productQuantities,
  handlePaginationChange,
  handlePageSizeChange,
  handleFilterChange,
  handleQuantityChange,
  addProductToBill,
  updateQuantity,
  deleteBillDetail,
  applyVoucher,
  processPayment,
  confirmBankingPayment,
  cancelBill,
  updateBillStatus,
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
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoicePDF, setInvoicePDF] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
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
  const [isImageViewModalOpen, setIsImageViewModal] = useState(false);
  const [selectedImagesForView, setSelectedImagesForView] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);

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

  // Invoice Modal Effect - open modal and create preview URL when we have Base64
  useEffect(() => {
    if (!invoicePDF) return;
    try {
      const byteCharacters = atob(invoicePDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setInvoiceUrl(url);
      setShowInvoiceModal(true);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error('Không thể tạo URL xem trước PDF:', e);
      setShowInvoiceModal(true); // vẫn mở modal để tải thủ công
    }
  }, [invoicePDF]);

  // Close Invoice modal with cleanup
  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    if (invoiceUrl) {
      URL.revokeObjectURL(invoiceUrl);
      setInvoiceUrl(null);
    }
    setInvoicePDF(null);
  };

  // Fetch Customers when Modal Opens or Filters/Pagination Change
  useEffect(() => {
    if (showCustomerModal && !showVisitingGuestForm) {
      fetchCustomers();
    }
  }, [showCustomerModal, customerFilters, customerPagination.page, customerPagination.size, showVisitingGuestForm]);

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
            provinceId: defaultAddress.provinceId != null ? Number(defaultAddress.provinceId) : prev.provinceId,
            provinceName: defaultAddress.provinceName || prev.provinceName,
            districtId: defaultAddress.districtId != null ? Number(defaultAddress.districtId) : prev.districtId,
            districtName: defaultAddress.districtName || prev.districtName,
            wardCode: defaultAddress.wardCode != null ? String(defaultAddress.wardCode) : prev.wardCode,
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
      const list = response?.data?.content || [];

      // Fallback: nếu không có bộ lọc và danh sách rỗng, thử endpoint khác
      const noFilters = !customerFilters.phoneNumber && !customerFilters.name && !customerFilters.email;
      if (noFilters && list.length === 0) {
        try {
          const fb = await axiosInstance.get('/user/search/client', {
            params: {
              code: null,
              name: null,
              phoneNumber: null,
              email: null,
              minLoyaltyPoints: null,
              maxLoyaltyPoints: null,
              birthDate: null,
              startDate: null,
              endDate: null,
              page: customerPagination.page,
              size: customerPagination.size,
            },
          });
          const fbList = fb?.data?.content || [];
          setCustomers(fbList);
          setCustomerPagination((prev) => ({ ...prev, totalPages: fb?.data?.totalPages || 1 }));
        } catch (fbErr) {
          console.warn('Fallback /user/search/client failed:', fbErr?.message);
          setCustomers(list);
          setCustomerPagination((prev) => ({ ...prev, totalPages: response?.data?.totalPages || 1 }));
        }
      } else {
        setCustomers(list);
        setCustomerPagination((prev) => ({ ...prev, totalPages: response?.data?.totalPages || 1 }));
      }
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
        provinceId: selectedAddress.provinceId != null ? Number(selectedAddress.provinceId) : prev.provinceId,
        provinceName: selectedAddress.provinceName || prev.provinceName,
        districtId: selectedAddress.districtId != null ? Number(selectedAddress.districtId) : prev.districtId,
        districtName: selectedAddress.districtName || prev.districtName,
        wardCode: selectedAddress.wardCode != null ? String(selectedAddress.wardCode) : prev.wardCode,
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
      try {
        setIsLoading(true);
        // MUST create banking transaction first
        await processPayment();
        // Now open confirm dialog (qrCode will be generated from bankingDetails)
        setShowConfirmPaymentModal(true);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể khởi tạo thanh toán chuyển khoản');
      } finally {
        setIsLoading(false);
      }
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

  // Download PDF (prefer using created URL)
  const downloadPDF = () => {
    if (invoiceUrl) {
      const link = document.createElement('a');
      link.href = invoiceUrl;
      link.download = `invoice_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    if (invoicePDF) {
      const byteCharacters = atob(invoicePDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${Date.now()}.pdf`;
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

  // Calculate total amount for bill (use promotionalPrice if available)
  const calculateTotalAmount = () => {
    if (!selectedBill || !safeBillDetails.length) return 0;
    return safeBillDetails.reduce((sum, detail) => {
      const unitPrice = Number(detail.promotionalPrice ?? detail.price ?? 0);
      const qty = Number(detail.quantity ?? 0);
      return sum + unitPrice * qty;
    }, 0);
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

  // Cancel bill handler with confirm and cleanup
  const handleCancelBillClick = async () => {
    if (!selectedBill) return;
    const ok = window.confirm('Bạn có chắc muốn hủy hóa đơn này?');
    if (!ok) return;
    try {
      setIsLoading(true);
      await cancelBill(selectedBill.id);
      toast.success('Đã hủy hóa đơn');
      setSelectedBill(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Hủy hóa đơn thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // If deliveryForm province/district is updated from outside (e.g., adding customer with saved address), ensure cascade
  // Removed auto-cascade here to avoid clearing prefilled selections on modal open.
  // Parent now ensures lists are loaded when modal opens.
  // useEffect(() => {
  //   if (!showDeliveryModal) return;
  //   if (deliveryForm?.provinceId) {
  //     handleAddressChange('provinceId', deliveryForm.provinceId);
  //   }
  // }, [deliveryForm?.provinceId, showDeliveryModal]);

  // useEffect(() => {
  //   if (!showDeliveryModal) return;
  //   if (deliveryForm?.districtId) {
  //     handleAddressChange('districtId', deliveryForm.districtId);
  //   }
  // }, [deliveryForm?.districtId, showDeliveryModal]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white shadow-md rounded-lg p-4 md:p-6 border border-gray-200">
          {/* If no bill selected, show placeholder instead of cart */}
          {!selectedBill ? (
            <div className="py-16 text-center text-gray-500">
              Chưa chọn hóa đơn. Vui lòng chọn một hóa đơn ở danh sách bên trái để bắt đầu.
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Giỏ Hàng - {selectedBill?.code || '---'} ({selectedBill?.billType || 'COUNTER'})
                </h2>
                <div className="flex items-center gap-3">
                  {/* Ẩn trạng thái thanh toán/giao hàng theo yêu cầu */}
                  {/* (Thanh toán | Giao hàng) chips removed */}
                  {/* Action buttons (QR removed) */}
                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      disabled={!selectedBill}
                      title="Thêm sản phẩm"
                    >
                      <HiOutlinePlus size={16} /> Thêm SP
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomerModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                      disabled={!selectedBill}
                      title="Chọn khách hàng"
                    >
                      <HiOutlineUser size={16} /> Khách hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryModal(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                      disabled={!selectedBill}
                      title="Nhập thông tin giao hàng"
                    >
                      <HiOutlineTruck size={16} /> Giao hàng
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelBillClick}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      disabled={!selectedBill || isLoading}
                      title="Hủy hóa đơn"
                    >
                      <HiOutlineTrash size={16} /> Hủy HĐ
                    </button>
                  </div>
                </div>
              </div>
              <div className="mb-4 text-sm text-gray-700">
                <p><strong>Khách hàng:</strong> {selectedBill?.customerName || 'Chưa có'}</p>
                <p><strong>Số điện thoại:</strong> {selectedBill?.phoneNumber || 'Chưa có'}</p>
                {selectedBill?.address && (
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
                      <th className="px-4 py-3">Kích cỡ</th>
                      <th className="px-4 py-3">Màu sắc</th>
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
              <p>Tổng tiền hàng: {(selectedBill?.totalMoney || 0).toLocaleString()} đ</p>
              <p>Giảm giá: {(selectedBill?.reductionAmount || 0).toLocaleString()} đ</p>
              <p>Phí vận chuyển: {(selectedBill?.moneyShip || 0).toLocaleString()} đ</p>
              <p className="font-semibold text-base">
                Thành tiền: {(selectedBill?.finalAmount || 0).toLocaleString()} đ
              </p>
              {console.log('💰 [CartAndPayment] Bill totals:', {
                totalMoney: selectedBill?.totalMoney,
                reductionAmount: selectedBill?.reductionAmount,
                finalAmount: selectedBill?.finalAmount,
                voucherCode: selectedBill?.voucherCode,
                appliedVoucher: appliedVoucher
              })}
              {renderVoucherMessage()}
            </div>
          </div>
          {/* Close fragment and conditional for selectedBill content */}
          </>
        )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white shadow-md rounded-lg p-4 md:p-6 border border-gray-200">
        {!selectedBill ? (
          <div className="py-8 text-center text-gray-500 text-sm">Chưa chọn hóa đơn.</div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Modals & Overlays */}
      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAddProductModal(false)} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-5xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Chọn sản phẩm</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setShowAddProductModal(false)}>
                <HiOutlineX size={18} />
              </button>
            </div>
            {/* Bộ Lọc Sản Phẩm */}
            <div className="mb-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Bộ Lọc Sản Phẩm</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mã SP</label>
                  <input name="code" value={filters.code} onChange={handleFilterChange} placeholder="Mã SP" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên SP</label>
                  <input name="name" value={filters.name} onChange={handleFilterChange} placeholder="Tên SP" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kích cỡ</label>
                  <input name="sizeName" value={filters.sizeName} onChange={handleFilterChange} placeholder="Kích cỡ" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Màu sắc</label>
                  <input name="colorName" value={filters.colorName} onChange={handleFilterChange} placeholder="Màu sắc" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giá từ</label>
                  <input name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Giá từ" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giá đến</label>
                  <input name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Giá đến" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            {/* Danh sách sản phẩm */}
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Ảnh</th>
                    <th className="px-3 py-2 text-left">Mã</th>
                    <th className="px-3 py-2 text-left">Tên SP</th>
                    <th className="px-3 py-2">Kích cỡ</th>
                    <th className="px-3 py-2">Màu sắc</th>
                    <th className="px-3 py-2 text-right">Giá</th>
                    <th className="px-3 py-2 text-center">Tồn kho</th>
                    <th className="px-3 py-2 text-center">SL</th>
                    <th className="px-3 py-2 text-center">Thêm</th>
                  </tr>
                </thead>
                <tbody>
                  {(productDetails || []).map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">
                        {p.images && p.images.length > 0 ? (
                          <img
                            src={`http://localhost:8080${p.images[0]?.url}`}
                            alt={p.productName || p.code}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">N/A</div>
                        )}
                      </td>
                      <td className="px-3 py-2">{p.code}</td>
                      <td className="px-3 py-2">{p.productName || '-'}</td>
                      <td className="px-3 py-2 text-center">{p.sizeName || 'N/A'}</td>
                      <td className="px-3 py-2 text-center">{p.colorName || 'N/A'}</td>
                      <td className="px-3 py-2 text-right">{(p.promotionalPrice || p.price || 0).toLocaleString()} đ</td>
                      <td className="px-3 py-2 text-center">{p.quantity ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={productQuantities[p.id] || 1}
                          onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                          className="w-16 text-center border rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => addProductToBill(p.id, productQuantities[p.id] || 1)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                          disabled={isLoading || !selectedBill}
                        >
                          Thêm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination + Page size */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div>Trang {pagination.productDetails.page + 1} / {pagination.productDetails.totalPages || 1}</div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={pagination.productDetails.size}
                  onChange={(e) => handlePageSizeChange('productDetails', e.target.value)}
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${pagination.productDetails.page <= 0 ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    onClick={() => handlePaginationChange('productDetails', Math.max(0, pagination.productDetails.page - 1))}
                    disabled={pagination.productDetails.page <= 0}
                  >
                    Trang trước
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${pagination.productDetails.page >= (pagination.productDetails.totalPages || 1) - 1 ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    onClick={() => handlePaginationChange('productDetails', Math.min((pagination.productDetails.totalPages || 1) - 1, pagination.productDetails.page + 1))}
                    disabled={pagination.productDetails.page >= (pagination.productDetails.totalPages || 1) - 1}
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCustomerModal(false)} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-5xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Chọn khách hàng</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setShowCustomerModal(false)}>
                <HiOutlineX size={18} />
              </button>
            </div>
            {/* Bộ Lọc Khách Hàng */}
            <div className="mb-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Bộ Lọc Khách Hàng</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SĐT</label>
                  <input name="phoneNumber" value={customerFilters.phoneNumber} onChange={handleCustomerFilterChange} placeholder="SĐT" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên</label>
                  <input name="name" value={customerFilters.name} onChange={handleCustomerFilterChange} placeholder="Tên" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input name="email" value={customerFilters.email} onChange={handleCustomerFilterChange} placeholder="Email" className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
                </div>
                <div className="flex items-end justify-end">
                  <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50" onClick={() => setShowVisitingGuestForm((s) => !s)}>
                    {showVisitingGuestForm ? 'Chọn từ danh sách' : 'Thêm khách vãng lai'}
                  </button>
                </div>
              </div>
            </div>

            {/* Hiển thị Form Khách Vãng Lai khi bật; ngược lại hiển thị danh sách khách hàng */}
            {showVisitingGuestForm ? (
              <div className="border rounded p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Thêm khách vãng lai</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tên khách</label>
                    <input
                      name="name"
                      value={visitingGuestForm.name}
                      onChange={handleVisitingGuestFormChange}
                      placeholder="Nhập tên khách"
                      className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại (10 số)</label>
                    <input
                      name="phoneNumber"
                      value={visitingGuestForm.phoneNumber}
                      onChange={handleVisitingGuestFormChange}
                      placeholder="VD: 0912345678"
                      className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    className="px-4 py-2 border rounded-lg"
                    onClick={() => setShowVisitingGuestForm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    onClick={addVisitingGuestToBill}
                    disabled={isLoading || !selectedBill}
                  >
                    Thêm vào hóa đơn
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên</th>
                      <th className="px-3 py-2 text-left">SĐT</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-center">Chọn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customers || []).map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="px-3 py-2 text-left">{c.name}</td>
                        <td className="px-3 py-2 text-left">{c.phoneNumber}</td>
                        <td className="px-3 py-2 text-left">{c.email || '-'}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => addLoyalCustomerToBill(c.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            disabled={!selectedBill}
                          >
                            Chọn
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!customers || customers.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-3 py-6 text-center text-gray-500">Không có khách hàng</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Customer pagination + page size */}
            <div className="flex items-center justify-between mt-3 text-sm">
              <div>Trang {customerPagination.page + 1} / {customerPagination.totalPages || 1}</div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={customerPagination.size}
                  onChange={(e) => setCustomerPagination((prev) => ({ ...prev, size: Number(e.target.value) || 10, page: 0 }))}
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
                <div className="flex items-center gap-2">
                  <button className={`px-4 py-2 rounded-md text-sm font-medium ${customerPagination.page <= 0 ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} onClick={() => handleCustomerPaginationChange(Math.max(0, customerPagination.page - 1))} disabled={customerPagination.page <= 0}>
                    Trang trước
                  </button>
                  <button className={`px-4 py-2 rounded-md text-sm font-medium ${customerPagination.page >= (customerPagination.totalPages || 1) - 1 ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} onClick={() => handleCustomerPaginationChange(Math.min((customerPagination.totalPages || 1) - 1, customerPagination.page + 1))} disabled={customerPagination.page >= (customerPagination.totalPages || 1) - 1}>
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeliveryModal(false)} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-3xl max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Thông tin giao hàng</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setShowDeliveryModal(false)}>
                <HiOutlineX size={18} />
              </button>
            </div>
            {/* Danh sách địa chỉ đã lưu của khách hàng (nếu có) */}
            {customerAddresses && customerAddresses.length > 0 && (
              <div className="mb-4 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Địa chỉ đã lưu</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customerAddresses.map((addr) => (
                    <label key={addr.id} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="savedAddress"
                        className="mt-1"
                        checked={selectedAddressId === addr.id}
                        onChange={() => handleAddressSelection(addr.id)}
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">
                          {addr.name} • {addr.phoneNumber}
                          {addr.isDefault && <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">Mặc định</span>}
                        </div>
                        <div className="text-gray-600">
                          {addr.address}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Chọn một địa chỉ để tự động điền vào form bên dưới.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tên khách hàng</label>
                <input name="customerName" value={deliveryForm.customerName} onChange={handleDeliveryFormChange} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Số điện thoại</label>
                <input name="phoneNumber" value={deliveryForm.phoneNumber} onChange={handleDeliveryFormChange} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Địa chỉ chi tiết</label>
                <input name="addressDetail" value={deliveryForm.addressDetail} onChange={handleDeliveryFormChange} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tỉnh/Thành</label>
                <select value={deliveryForm.provinceId || ''} onChange={(e) => handleAddressChange('provinceId', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500">
                  <option value="">-- Chọn tỉnh/thành --</option>
                  {(provinces || []).map((p) => (
                    <option key={p.ProvinceID || p.provinceId || p.id} value={p.ProvinceID || p.provinceId || p.id}>{p.ProvinceName || p.provinceName || p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Quận/Huyện</label>
                <select value={deliveryForm.districtId || ''} onChange={(e) => handleAddressChange('districtId', e.target.value ? Number(e.target.value) : null)} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" disabled={!deliveryForm.provinceId}>
                  <option value="">-- Chọn quận/huyện --</option>
                  {(districts || []).map((d) => (
                    <option key={d.DistrictID || d.districtId || d.id} value={d.DistrictID || d.districtId || d.id}>{d.DistrictName || d.districtName || d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phường/Xã</label>
                <select value={deliveryForm.wardCode || ''} onChange={(e) => handleAddressChange('wardCode', e.target.value || null)} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" disabled={!deliveryForm.districtId}>
                  <option value="">-- Chọn phường/xã --</option>
                  {(wards || []).map((w) => (
                    <option key={String(w.WardCode || w.wardCode || w.code)} value={String(w.WardCode || w.wardCode || w.code)}>{w.WardName || w.wardName || w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ngày giao mong muốn</label>
                <input type="date" name="desiredDate" value={deliveryForm.desiredDate} onChange={handleDeliveryFormChange} className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
                <button className="px-4 py-2 border rounded-lg" onClick={() => setShowDeliveryModal(false)}>Đóng</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg" onClick={createDeliveryBill} disabled={!selectedBill}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowConfirmPaymentModal(false)} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-2 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800">Xác nhận thanh toán</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setShowConfirmPaymentModal(false)}>
                <HiOutlineX size={18} />
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <p>Mã đơn: <strong>{selectedBill?.code}</strong></p>
              <p>Số tiền: <strong>{(selectedBill?.finalAmount || 0).toLocaleString()} đ</strong></p>
              {qrCodeUrl && (
                <div className="mt-2">
                  <img src={qrCodeUrl} alt="QR chuyển khoản" className="w-64 h-64 object-contain mx-auto border rounded" />
                  <p className="text-xs text-gray-500 mt-1 text-center">Quét QR để chuyển khoản. Sau khi nhận tiền, bấm "Đã nhận tiền".</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-4 py-2 border rounded-lg" onClick={() => setShowConfirmPaymentModal(false)}>Đóng</button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg" onClick={handleConfirmBankingPayment} disabled={isLoading || !selectedBill}>Đã nhận tiền</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeInvoiceModal} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-3xl shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Hóa đơn</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={closeInvoiceModal}>
                <HiOutlineX size={18} />
              </button>
            </div>
            <div className="text-sm space-y-3">
              {invoiceUrl ? (
                <div className="w-full h-[70vh] border rounded overflow-hidden">
                  <iframe
                    title="Invoice Preview"
                    src={invoiceUrl}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <p className="mb-2">Hóa đơn đã sẵn sàng tải xuống.</p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button className="px-4 py-2 border rounded-lg" onClick={closeInvoiceModal}>Đóng</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg" onClick={downloadPDF}>Tải PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {isImageViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsImageViewModalOpen(false)} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-4xl shadow-xl">
            <div className="flex items-center justify-between mb-2 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800">Hình ảnh sản phẩm</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setIsImageViewModalOpen(false)}>
                <HiOutlineX size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(selectedImagesForView || []).map((img) => (
                <img key={img.id || img.url} src={`http://localhost:8080${img.url || img}`} alt="SP" className="w-full h-40 object-cover rounded" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voucher Select Modal */}
      {showSelectVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSelectVoucherModal(false)} />
          <div className="relative bg-white rounded-xl p-8 w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Chọn Voucher</h3>
              <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setShowSelectVoucherModal(false)}>
                <HiOutlineX size={18} />
              </button>
            </div>

            {/* Danh sách voucher */}
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Mã</th>
                    <th className="px-3 py-2 text-left">Tên</th>
                    <th className="px-3 py-2 text-center">Loại</th>
                    <th className="px-3 py-2 text-right">Giá trị</th>
                    <th className="px-3 py-2 text-right">ĐH tối thiểu</th>
                    <th className="px-3 py-2 text-center">Hiệu lực</th>
                    <th className="px-3 py-2 text-center">Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  {(vouchers || []).length > 0 ? (
                    vouchers.map((v) => {
                      const isPercent = v.type === 'PERCENTAGE';
                      const valueText = isPercent
                        ? `${v.percentageDiscountValue}%${v.maxDiscountValue ? ` (tối đa ${Number(v.maxDiscountValue || 0).toLocaleString()} đ)` : ''}`
                        : `${Number(v.fixedDiscountValue || 0).toLocaleString()} đ`;
                      const minOrderText = Number(v.minOrderValue || 0).toLocaleString();
                      const rangeText = `${v.startTime ? new Date(v.startTime).toLocaleDateString('vi-VN') : '-'} — ${v.endTime ? new Date(v.endTime).toLocaleDateString('vi-VN') : '-'}`;
                      return (
                        <tr key={v.id || v.code} className="border-t">
                          <td className="px-3 py-2 text-left font-medium text-gray-800">{v.code}</td>
                          <td className="px-3 py-2 text-left">{v.name}</td>
                          <td className="px-3 py-2 text-center">{isPercent ? 'Phần trăm' : 'Tiền cố định'}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">{valueText}</td>
                          <td className="px-3 py-2 text-right">{minOrderText}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">{rangeText}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleSelectVoucher(v)}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              Chọn
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-gray-500">Không có voucher</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang + kích thước trang */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div>Trang {pagination.vouchers.page + 1} / {pagination.vouchers.totalPages || 1}</div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={pagination.vouchers.size}
                  onChange={(e) => handlePageSizeChange('vouchers', e.target.value)}
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${pagination.vouchers.page <= 0 ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    onClick={() => handlePaginationChange('vouchers', Math.max(0, pagination.vouchers.page - 1))}
                    disabled={pagination.vouchers.page <= 0}
                  >
                    Trang trước
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md text-sm font-medium ${pagination.vouchers.page >= (pagination.vouchers.totalPages || 1) - 1 ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    onClick={() => handlePaginationChange('vouchers', Math.min((pagination.vouchers.totalPages || 1) - 1, pagination.vouchers.page + 1))}
                    disabled={pagination.vouchers.page >= (pagination.vouchers.totalPages || 1) - 1}
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartAndPayment;

// Xác nhận thanh toán chuyển khoản thành công