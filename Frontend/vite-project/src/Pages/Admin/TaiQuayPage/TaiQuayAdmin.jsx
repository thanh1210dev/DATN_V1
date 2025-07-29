import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debounce } from 'lodash';
import axiosInstance from '../../../Service/axiosInstance';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import VoucherApi from '../../../Service/AdminDotGiamGiaSevice/VoucherApi';
import BillManagement from './BillManagement';
import CartAndPayment from './CartAndPayment';

const TaiQuayAdmin = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [billDetails, setBillDetails] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [paymentType, setPaymentType] = useState('CASH');
  const [cashPaid, setCashPaid] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSelectVoucherModal, setShowSelectVoucherModal] = useState(false);
  const [showBankingInfo, setShowBankingInfo] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [bankingDetails, setBankingDetails] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [deliveryForm, setDeliveryForm] = useState({
    customerName: '',
    phoneNumber: '',
    addressDetail: '',
    provinceId: null,
    districtId: null,
    wardCode: null,
    desiredDate: '',
  });
  const [pagination, setPagination] = useState({
    bills: { page: 0, size: 5, totalPages: 1 },
    productDetails: { page: 0, size: 10, totalPages: 1 },
    billDetails: { page: 0, size: 10, totalPages: 1 },
    vouchers: { page: 0, size: 10, totalPages: 1 },
  });
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    sizeName: '',
    colorName: '',
    minPrice: '',
    maxPrice: '',
  });
  const [productQuantities, setProductQuantities] = useState({});

  // Debounced filter change handler
  const debouncedHandleFilterChange = useCallback(
    debounce((name, value) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
      setPagination((prev) => ({
        ...prev,
        productDetails: { ...prev.productDetails, page: 0 },
      }));
    }, 300),
    []
  );

  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      const response = await axiosInstance.get('/ghn-address/provinces');
      setProvinces(response.data.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách tỉnh');
    }
  };

  // Fetch districts based on provinceId
  const fetchDistricts = async (provinceId) => {
    if (!provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    try {
      const response = await axiosInstance.get('/ghn-address/districts', {
        params: { provinceId },
      });
      setDistricts(response.data.data || []);
      setWards([]);
    } catch (error) {
      toast.error('Không thể tải danh sách huyện');
    }
  };

  // Fetch wards based on districtId
  const fetchWards = async (districtId) => {
    if (!districtId) {
      setWards([]);
      return;
    }
    try {
      const response = await axiosInstance.get('/ghn-address/wards', {
        params: { districtId },
      });
      setWards(response.data.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách xã/phường');
    }
  };

  // Fetch bills Tạo hóa đơn
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/bills/search', {
        params: { status: 'PENDING', page: pagination.bills.page, size: pagination.bills.size },
      });
      setBills(response.data.content);
      setPagination((prev) => ({
        ...prev,
        bills: { ...prev.bills, totalPages: response.data.totalPages },
      }));
      if (selectedBill) {
        const updatedBill = response.data.content.find((bill) => bill.id === selectedBill.id);
        if (updatedBill) {
          setSelectedBill(updatedBill);
        } else {
          setSelectedBill(null);
          setBillDetails([]);
        }
      }
    } catch (error) {
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product details with filters  Ngày giao mong muốn  desiredDate   
  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      const response = await ProductDetailService.getAllPage(
        pagination.productDetails.page,
        pagination.productDetails.size,
        filters.code || null,
        filters.name || null,
        filters.sizeName || null,
        filters.colorName || null,
        filters.minPrice ? parseFloat(filters.minPrice) : null,
        filters.maxPrice ? parseFloat(filters.maxPrice) : null
      );
      setProductDetails(response.content);
      setPagination((prev) => ({
        ...prev,
        productDetails: { ...prev.productDetails, totalPages: response.totalPages },
      }));
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vouchers - chỉ load voucher PUBLIC cho admin bán hàng tại quầy
  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const response = await VoucherApi.searchVouchers({
        page: pagination.vouchers.page,
        size: pagination.vouchers.size,
        status: 'ACTIVE',
        typeUser: 'PUBLIC',
      });
      setVouchers(response.data.content);
      setPagination((prev) => ({
        ...prev,
        vouchers: { ...prev.vouchers, totalPages: response.data.totalPages },
      }));
    } catch (error) {
      toast.error('Không thể tải danh sách voucher');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch bill details
  const fetchBillDetails = async (billId) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/bill-details/${billId}`, {
        params: { page: pagination.billDetails.page, size: pagination.billDetails.size },
      });
      setBillDetails(response.data.content);
      setPagination((prev) => ({
        ...prev,
        billDetails: { ...prev.billDetails, totalPages: response.data.totalPages },
      }));
    } catch (error) {
      toast.error('Không thể tải chi tiết hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch applied voucher details
  const fetchAppliedVoucher = async (voucherCode) => {
    // Kiểm tra và làm sạch voucherCode
    if (!voucherCode || voucherCode === 'null' || voucherCode === 'undefined' || voucherCode.trim() === '') {
      console.log('⚠️ [TaiQuay] Invalid voucher code:', voucherCode);
      setAppliedVoucher(null);
      return;
    }
    
    // Làm sạch voucherCode - loại bỏ "null" ở đầu nếu có
    const cleanVoucherCode = voucherCode.replace(/^null/i, '').trim();
    if (!cleanVoucherCode) {
      console.log('⚠️ [TaiQuay] Empty voucher code after cleaning:', voucherCode);
      setAppliedVoucher(null);
      return;
    }
    
    try {
      console.log('🔍 [TaiQuay] Fetching voucher with code:', cleanVoucherCode);
      
      // Thử API mới trước - lấy voucher theo code chính xác
      try {
        const directResponse = await VoucherApi.getVoucherByCode(cleanVoucherCode);
        if (directResponse.data) {
          console.log('✅ [TaiQuay] Found voucher via direct API:', directResponse.data);
          setAppliedVoucher(directResponse.data);
          return;
        }
      } catch (directError) {
        console.log('⚠️ [TaiQuay] Direct API failed, trying search API:', directError.message);
      }
      
      // Fallback: sử dụng search API chỉ cho voucher PUBLIC
      const response = await VoucherApi.searchVouchers({
        page: 0,
        size: 10,
        code: cleanVoucherCode,
        status: 'ACTIVE',
        typeUser: 'PUBLIC',
      });
      
      console.log('📋 [TaiQuay] Voucher search response:', response.data);
      
      if (response.data.content && response.data.content.length > 0) {
        // Tìm voucher có code khớp chính xác
        const exactMatch = response.data.content.find(v => v.code === voucherCode);
        if (exactMatch) {
          console.log('✅ [TaiQuay] Found exact voucher match via search:', exactMatch);
          setAppliedVoucher(exactMatch);
        } else {
          console.log('⚠️ [TaiQuay] No exact code match found in search results');
          setAppliedVoucher(response.data.content[0]); // Fallback to first result
        }
      } else {
        console.log('❌ [TaiQuay] No vouchers found');
        setAppliedVoucher(null);
      }
    } catch (error) {
      console.error('❌ [TaiQuay] Failed to fetch voucher details:', error);
      setAppliedVoucher(null);
    }
  };

  // Create new bill  Thông Tin Giao Hàng
  const createBill = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/bills/counter-sale');
      setSelectedBill(response.data);
      setBillDetails([]);
      setVoucherCode(response.data.voucherCode || '');
      await fetchAppliedVoucher(response.data.voucherCode);
      toast.success('Tạo hóa đơn thành công');
      await fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Create delivery bill
  const createDeliveryBill = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    if (!deliveryForm.customerName || !deliveryForm.phoneNumber || !deliveryForm.addressDetail) {
      toast.error('Vui lòng nhập đầy đủ thông tin khách hàng');
      return;
    }
    if (!/^\d{10}$/.test(deliveryForm.phoneNumber)) {
      toast.error('Số điện thoại phải có đúng 10 chữ số');
      return;
    }
    if (!deliveryForm.provinceId || !deliveryForm.districtId || !deliveryForm.wardCode) {
      toast.error('Vui lòng chọn đầy đủ tỉnh, huyện, xã');
      return;
    }
    try {
      setIsLoading(true);
      const formattedDesiredDate = deliveryForm.desiredDate
        ? `${deliveryForm.desiredDate}T00:00:00Z`
        : null;
      const response = await axiosInstance.post('/bills/delivery-sale', {
        billId: selectedBill.id,
        customerName: deliveryForm.customerName,
        phoneNumber: deliveryForm.phoneNumber,
        addressDetail: deliveryForm.addressDetail,
        provinceId: deliveryForm.provinceId,
        districtId: deliveryForm.districtId,
        wardCode: deliveryForm.wardCode,
        desiredDate: formattedDesiredDate,
      });
      setSelectedBill(response.data);
      setShowDeliveryModal(false);
      setDeliveryForm({
        customerName: '',
        phoneNumber: '',
        addressDetail: '',
        provinceId: null,
        districtId: null,
        wardCode: null,
        desiredDate: '',
      });
      setDistricts([]);
      setWards([]);
      await fetchBills();
      toast.success('Cập nhật thông tin giao hàng thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin giao hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Add product to bill with quantity
  const addProductToBill = async (productDetailId, quantity = 1) => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hoặc tạo hóa đơn trước');
      return;
    }
    if (quantity < 1) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    try {
      setIsLoading(true);
      console.log('🛒 [TaiQuay] Adding product to bill:', { productDetailId, quantity, billId: selectedBill.id });
      
      await axiosInstance.post(`/bill-details/${selectedBill.id}`, {
        productDetailId,
        quantity,
      });
      await fetchBillDetails(selectedBill.id);
      await fetchBills();
      setShowAddProductModal(false);
      setShowQRScanner(false);
      fetchProductDetails();
      setProductQuantities((prev) => ({ ...prev, [productDetailId]: 1 }));
      toast.success('Thêm sản phẩm thành công');
    } catch (error) {
      console.error('❌ [TaiQuay] Add product failed:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = async (billDetailId, quantity) => {
    if (quantity < 1) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
    try {
      setIsLoading(true);
      console.log('📝 [TaiQuay] Updating quantity:', { billDetailId, quantity });
      
      await axiosInstance.put(`/bill-details/${billDetailId}/quantity`, null, { params: { quantity } });
      await fetchBillDetails(selectedBill.id);
      await fetchBills();
      toast.success('Cập nhật số lượng thành công');
    } catch (error) {
      console.error('❌ [TaiQuay] Update quantity failed:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete bill detail
  const deleteBillDetail = async (billDetailId) => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/bill-details/${billDetailId}`);
      await fetchBillDetails(selectedBill.id);
      await fetchBills(); // fetchBills đã có logic update selectedBill
      toast.success('Xóa sản phẩm thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply voucher
  const applyVoucher = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    
    // Kiểm tra và làm sạch voucherCode
    if (!voucherCode || voucherCode === 'null' || voucherCode === 'undefined') {
      toast.error('Vui lòng nhập mã voucher hợp lệ');
      return;
    }
    
    // Làm sạch voucherCode - loại bỏ "null" ở đầu nếu có
    let cleanVoucherCode = voucherCode.replace(/^null/i, '').trim();
    if (!cleanVoucherCode) {
      toast.error('Mã voucher không hợp lệ');
      return;
    }
    
    console.log('🏷️ [TaiQuay] Applying voucher:', { 
      originalCode: voucherCode, 
      cleanCode: cleanVoucherCode,
      billId: selectedBill.id 
    });
    
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/bills/${selectedBill.id}/voucher`, null, {
        params: { voucherCode: cleanVoucherCode },
      });
      
      console.log('✅ [TaiQuay] Voucher applied successfully:', response.data);
      console.log('🔍 [TaiQuay] Response data type:', typeof response.data, Array.isArray(response.data));
      
      // Validate response data
      if (!response.data || Array.isArray(response.data) || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      setSelectedBill(response.data);
      setVoucherCode(response.data.voucherCode || '');
      await fetchBills();
      
      // Only fetch applied voucher if we have a valid voucher code
      if (response.data.voucherCode) {
        await fetchAppliedVoucher(response.data.voucherCode);
      }
      
      toast.success('Áp dụng voucher thành công');
    } catch (error) {
      console.error('❌ [TaiQuay] Voucher apply failed:', error);
      toast.error(error.response?.data?.message || 'Không thể áp dụng voucher');
    } finally {
      setIsLoading(false);
    }
  };

  // Process payment
  const processPayment = async () => {
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
      const response = await axiosInstance.post(
        `/bills/${selectedBill.id}/payment`,
        {},
        { params: { paymentType, amount: paymentType === 'CASH' ? parseFloat(cashPaid) : undefined } }
      );
      setSelectedBill(response.data.bill || null);
      await fetchBills();
      if (paymentType === 'BANKING') {
        setBankingDetails(response.data);
        setShowBankingInfo(true);
      } else {
        toast.success('Thanh toán thành công');
        setSelectedBill(null);
        setCashPaid('');
        setChangeAmount(0);
        setVoucherCode('');
        setAppliedVoucher(null);
      }
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý thanh toán');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm banking payment
  const confirmBankingPayment = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/bills/${selectedBill.id}/confirm-banking`);
      setSelectedBill(null);
      setBankingDetails(null);
      setShowBankingInfo(false);
      setVoucherCode('');
      setAppliedVoucher(null);
      await fetchBills();
      toast.success('Xác nhận thanh toán chuyển khoản thành công');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel bill
  const cancelBill = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    try {
      setIsLoading(true);
      await axiosInstance.put(`/bills/${selectedBill.id}/status`, null, { params: { status: 'CANCELLED' } });
      setSelectedBill(null);
      setBillDetails([]);
      setVoucherCode('');
      setAppliedVoucher(null);
      setCashPaid('');
      setChangeAmount(0);
      setDeliveryForm({
        customerName: '',
        phoneNumber: '',
        addressDetail: '',
        provinceId: null,
        districtId: null,
        wardCode: null,
        desiredDate: '',
      });
      await fetchBills();
      toast.success('Hủy hóa đơn thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR scan
  const handleQRScan = async (decodedText) => {
    console.log('QR code scanned:', decodedText);
    try {
      const code = decodedText.trim();
      if (!code) {
        toast.error('Mã QR không hợp lệ');
        return;
      }
      let product = productDetails.find((p) => p.code.toLowerCase() === code.toLowerCase());
      if (product) {
        await addProductToBill(product.id, productQuantities[product.id] || 1);
        return;
      }
      const response = await axiosInstance.get('/product-details/search', {
        params: {
          code,
          page: 0,
          size: 1,
          status: 'AVAILABLE',
        },
      });
      if (response.data.content.length > 0) {
        product = response.data.content[0];
        await addProductToBill(product.id, productQuantities[product.id] || 1);
      } else {
        toast.error(`Không tìm thấy sản phẩm với mã ${code}`);
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm sản phẩm từ mã QR');
    }
  };

  // Handle pagination change
  const handlePaginationChange = (section, page) => {
    setPagination((prev) => ({
      ...prev,
      [section]: { ...prev[section], page },
    }));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    debouncedHandleFilterChange(name, value);
  };

  // Handle delivery form change
  const handleDeliveryFormChange = (e) => {
    const { name, value } = e.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle address selection
  const handleAddressChange = (field, value) => {
    setDeliveryForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'provinceId') {
      setDeliveryForm((prev) => ({ ...prev, districtId: null, wardCode: null }));
      fetchDistricts(value);
    } else if (field === 'districtId') {
      setDeliveryForm((prev) => ({ ...prev, wardCode: null }));
      fetchWards(value);
    }
  };

  // Handle quantity change for modal
  const handleQuantityChange = (productDetailId, value) => {
    const quantity = Math.max(1, parseInt(value) || 1);
    setProductQuantities((prev) => ({
      ...prev,
      [productDetailId]: quantity,
    }));
  };

  // Calculate change amount
  useEffect(() => {
    if (selectedBill && paymentType === 'CASH' && cashPaid) {
      const finalAmount = selectedBill.finalAmount || 0;
      const paid = parseFloat(cashPaid) || 0;
      setChangeAmount(paid - finalAmount);
    } else {
      setChangeAmount(0);
    }
  }, [selectedBill, paymentType, cashPaid]);

  // Fetch applied voucher when selectedBill changes
  useEffect(() => {
    if (selectedBill && selectedBill.voucherCode) {
      setVoucherCode(selectedBill.voucherCode); // Sync voucherCode với selectedBill
      fetchAppliedVoucher(selectedBill.voucherCode);
    } else {
      setAppliedVoucher(null);
      if (selectedBill) {
        setVoucherCode(''); // Reset voucherCode khi selectedBill không có voucher
      }
    }
  }, [selectedBill]);

  // Initial fetch
  useEffect(() => {
    fetchBills();
    fetchProvinces();
  }, [pagination.bills.page]);

  useEffect(() => {
    fetchProductDetails();
  }, [pagination.productDetails.page, filters]);

  useEffect(() => {
    fetchVouchers();
  }, [pagination.vouchers.page]);

  useEffect(() => {
    if (selectedBill) {
      fetchBillDetails(selectedBill.id);
    } else {
      setBillDetails([]);
    }
  }, [selectedBill, pagination.billDetails.page]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        limit={5}
        containerId="taiQuayToast"
      />
      <BillManagement
        bills={bills}
        selectedBill={selectedBill}
        setSelectedBill={setSelectedBill}
        createBill={createBill}
        isLoading={isLoading}
        pagination={pagination}
        handlePaginationChange={handlePaginationChange}
      />
      <CartAndPayment
        selectedBill={selectedBill}
        billDetails={billDetails}
        productDetails={productDetails}
        vouchers={vouchers}
        voucherCode={voucherCode}
        setVoucherCode={setVoucherCode}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        cashPaid={cashPaid}
        setCashPaid={setCashPaid}
        changeAmount={changeAmount}
        setChangeAmount={setChangeAmount}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        showAddProductModal={showAddProductModal}
        setShowAddProductModal={setShowAddProductModal}
        showSelectVoucherModal={showSelectVoucherModal}
        setShowSelectVoucherModal={setShowSelectVoucherModal}
        showBankingInfo={showBankingInfo}
        setShowBankingInfo={setShowBankingInfo}
        showQRScanner={showQRScanner}
        setShowQRScanner={setShowQRScanner}
        bankingDetails={bankingDetails}
        setBankingDetails={setBankingDetails}
        pagination={pagination}
        filters={filters}
        productQuantities={productQuantities}
        handlePaginationChange={handlePaginationChange}
        handleFilterChange={handleFilterChange}
        handleQuantityChange={handleQuantityChange}
        addProductToBill={addProductToBill}
        updateQuantity={updateQuantity}
        deleteBillDetail={deleteBillDetail}
        applyVoucher={applyVoucher}
        processPayment={processPayment}
        confirmBankingPayment={confirmBankingPayment}
        cancelBill={cancelBill}
        handleQRScan={handleQRScan}
        appliedVoucher={appliedVoucher}
        setAppliedVoucher={setAppliedVoucher}
        setSelectedBill={setSelectedBill}
        showDeliveryModal={showDeliveryModal}
        setShowDeliveryModal={setShowDeliveryModal}
        provinces={provinces}
        districts={districts}
        wards={wards}
        deliveryForm={deliveryForm}
        setDeliveryForm={setDeliveryForm}
        handleDeliveryFormChange={handleDeliveryFormChange}
        handleAddressChange={handleAddressChange}
        createDeliveryBill={createDeliveryBill}
      />
    </div>
  );
};

export default TaiQuayAdmin;