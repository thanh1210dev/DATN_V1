import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../../Service/axiosInstance';
import ProductDetailService from '../../../Service/AdminProductSevice/ProductDetailService';
import VoucherApi from '../../../Service/AdminDotGiamGiaSevice/VoucherApi';
import Select from 'react-select';

const TaiQuayAdmin = () => {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [billDetails, setBillDetails] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    productDetails: { page: 0, size: 5, totalPages: 1 },
    billDetails: { page: 0, size: 5, totalPages: 1 },
    vouchers: { page: 0, size: 5, totalPages: 1 },
  });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSelectVoucherModal, setShowSelectVoucherModal] = useState(false);
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    sizeName: '',
    colorName: '',
    minPrice: '',
    maxPrice: '',
  });

  // Fetch bills
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/bills/search', {
        params: { page: 0, size: 5 },
      });
      setBills(response.data.content);
    } catch (error) {
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product details with filters
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
      toast.error('Không thể tải danh sách chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const response = await VoucherApi.searchVouchers({
        page: pagination.vouchers.page,
        size: pagination.vouchers.size,
        status: 'ACTIVE',
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

  // Create new bill
  const createBill = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/bills/counter-sale');
      setSelectedBill(response.data);
      setBillDetails([]);
      fetchBills();
      toast.success('Tạo hóa đơn thành công');
    } catch (error) {
      toast.error('Không thể tạo hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  // Add product to bill
  const addProductToBill = async (productDetailId) => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hoặc tạo hóa đơn trước');
      return;
    }
    try {
      setIsLoading(true);
      await axiosInstance.post(`/bill-details/${selectedBill.id}/product`, { productDetailId });
      await fetchBillDetails(selectedBill.id);
      await fetchBills();
      setShowAddProductModal(false);
      toast.success('Thêm sản phẩm thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = async (billDetailId, quantity) => {
    try {
      setIsLoading(true);
      await axiosInstance.put(`/bill-details/${billDetailId}/quantity`, null, { params: { quantity } });
      fetchBillDetails(selectedBill.id);
      fetchBills();
      toast.success('Cập nhật số lượng thành công');
    } catch (error) {
      toast.error('Không thể cập nhật số lượng');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete bill detail
  const deleteBillDetail = async (billDetailId) => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/bill-details/${billDetailId}`);
      fetchBillDetails(selectedBill.id);
      fetchBills();
      toast.success('Xóa sản phẩm thành công');
    } catch (error) {
      toast.error('Không thể xóa sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply voucher
  const applyVoucher = async () => {
    if (!selectedBill || !voucherCode) {
      toast.error('Vui lòng chọn hóa đơn và nhập mã voucher');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(`/bills/${selectedBill.id}/voucher`, null, { params: { voucherCode } });
      setSelectedBill(response.data);
      fetchBills();
      toast.success('Áp dụng voucher thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể áp dụng voucher');
    } finally {
      setIsLoading(false);
    }
  };

  // Process payment with validation
  const processPayment = async () => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    const finalAmount = selectedBill.finalAmount || 0;
    if (paymentType === 'CASH' && cashPaid) {
      const amount = parseFloat(cashPaid);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Số tiền phải là số dương');
        return;
      }
      if (amount < finalAmount) {
        toast.error('Số tiền phải lớn hơn hoặc bằng tổng thanh toán');
        return;
      }
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        `/bills/${selectedBill.id}/payment`,
        { amount: paymentType === 'CASH' ? cashPaid : undefined },
        { params: { paymentType } }
      );
      setSelectedBill(response.data.bill);
      fetchBills();
      if (paymentType === 'BANKING') {
        toast.success(`Vui lòng chuyển khoản với thông tin: ${response.data.bankName}, ${response.data.accountName}, ${response.data.bankAccount}`);
      } else {
        toast.success('Thanh toán thành công');
        window.location.reload(); // Reload trang khi thanh toán thành công
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý thanh toán');
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
      setSelectedBill(response.data);
      fetchBills();
      toast.success('Xác nhận thanh toán chuyển khoản thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  // Update bill status
  const updateBillStatus = async (status) => {
    if (!selectedBill) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    if (!['PENDING', 'PAID'].includes(status)) return;
    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`/bills/${selectedBill.id}/status`, null, { params: { status } });
      setSelectedBill(response.data);
      fetchBills();
      toast.success('Cập nhật trạng thái hóa đơn thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setIsLoading(false);
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
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, productDetails: { ...prev.productDetails, page: 0 } }));
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

  // Initial fetch
  useEffect(() => {
    fetchBills();
    fetchProductDetails();
    fetchVouchers();
  }, [pagination.productDetails.page, pagination.vouchers.page, filters]);

  useEffect(() => {
    if (selectedBill) {
      fetchBillDetails(selectedBill.id);
    }
  }, [pagination.billDetails.page, selectedBill]);

  const handleVoucherSelect = (voucherCode) => {
    setVoucherCode(voucherCode);
    setShowSelectVoucherModal(false);
    toast.success('Mã voucher đã được điền');
  };

  const incrementQuantity = (detailId) => {
    const detail = billDetails.find(d => d.id === detailId);
    if (detail) updateQuantity(detailId, detail.quantity + 1);
  };

  const decrementQuantity = (detailId) => {
    const detail = billDetails.find(d => d.id === detailId);
    if (detail && detail.quantity > 1) updateQuantity(detailId, detail.quantity - 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      
      {/* Bill Selection */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Quản lý hóa đơn</h2>
          <button
            onClick={createBill}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            disabled={isLoading}
          >
            <HiOutlinePlus className="mr-2" size={16} />
            Tạo hóa đơn
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {bills.map((bill) => (
            <button
              key={bill.id}
              onClick={() => {
                setSelectedBill(bill);
                setPagination((prev) => ({ ...prev, billDetails: { ...prev.billDetails, page: 0 } }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedBill?.id === bill.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Hóa đơn {bill.id} ({bill.code})
            </button>
          ))}
        </div>
        {selectedBill && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Thông tin hóa đơn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p><strong>Mã hóa đơn:</strong> {selectedBill.code}</p>
              <p><strong>Tổng tiền:</strong> {(selectedBill.finalAmount || 0).toLocaleString()} đ</p>
              <p><strong>Trạng thái:</strong> {selectedBill.status === 'PENDING' ? 'Chờ thanh toán' : 'Đã thanh toán'}</p>
              <p><strong>Ngày tạo:</strong> {new Date(selectedBill.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc sản phẩm</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã sản phẩm</label>
            <input
              type="text"
              name="code"
              value={filters.code}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              placeholder="Nhập mã sản phẩm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              placeholder="Nhập tên sản phẩm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kích cỡ</label>
            <input
              type="text"
              name="sizeName"
              value={filters.sizeName}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              placeholder="Nhập kích cỡ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
            <input
              type="text"
              name="colorName"
              value={filters.colorName}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              placeholder="Nhập màu sắc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá tối thiểu</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              placeholder="Nhập giá tối thiểu"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá tối đa</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              placeholder="Nhập giá tối đa"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Giỏ hàng</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              disabled={isLoading}
            >
              <HiOutlinePlus className="mr-2" size={16} />
              Thêm sản phẩm
            </button>
            <button
              onClick={() => setShowSelectVoucherModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              disabled={isLoading}
            >
              Chọn Voucher
            </button>
            <button
              onClick={() => {/* Logic add voucher */}}
              className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              disabled={isLoading}
            >
              <HiOutlinePlus className="mr-2" size={16} />
              Thêm Voucher
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
              <tr>
                <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                <th className="px-6 py-3">Sản phẩm</th>
                <th className="px-6 py-3">Kích cỡ</th>
                <th className="px-6 py-3">Màu sắc</th>
                <th className="px-6 py-3">Số lượng</th>
                <th className="px-6 py-3">Tổng tiền</th>
                <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {billDetails.length > 0 ? (
                billDetails.map((detail, index) => (
                  <tr key={detail.id} className="border-b hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-3 text-center">{index + 1}</td>
                    <td className="px-6 py-3 flex items-center space-x-3">
                      {detail.images && detail.images[0] && (
                        <img
                          src={`http://localhost:8080${detail.images[0].url}`}
                          alt={detail.productName}
                          className="w-12 h-12 object-cover rounded-md"
                          onError={() => console.error(`Failed to load image: http://localhost:8080${detail.images[0].url}`)}
                        />
                      )}
                      <div>
                        <p className="font-medium">{detail.productName}</p>
                        <p className="text-xs text-gray-500">Mã: {detail.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">{detail.sizeName || 'N/A'}</td>
                    <td className="px-6 py-3">{detail.colorName || 'N/A'}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => decrementQuantity(detail.id)}
                          className="p-1 bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none transition-colors"
                          disabled={isLoading}
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{detail.quantity}</span>
                        <button
                          onClick={() => incrementQuantity(detail.id)}
                          className="p-1 bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none transition-colors"
                          disabled={isLoading}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3">{(detail.totalPrice || 0).toLocaleString()} đ</td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => deleteBillDetail(detail.id)}
                        className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        disabled={isLoading}
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Chưa có sản phẩm trong giỏ hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePaginationChange('billDetails', pagination.billDetails.page - 1)}
              disabled={pagination.billDetails.page === 0}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
              Trang {pagination.billDetails.page + 1} / {pagination.billDetails.totalPages}
            </span>
            <button
              onClick={() => handlePaginationChange('billDetails', pagination.billDetails.page + 1)}
              disabled={pagination.billDetails.page + 1 >= pagination.billDetails.totalPages}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      </div>

      {/* Payment and Status Section */}
      {selectedBill && (
        <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Thanh toán & Trạng thái</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANKING">Chuyển khoản</option>
                <option value="VNPAY">VNPay</option>
              </select>
              {paymentType === 'CASH' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiền khách trả</label>
                    <input
                      type="number"
                      value={cashPaid}
                      onChange={(e) => setCashPaid(e.target.value)}
                      placeholder="Nhập tiền khách trả"
                      className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiền thừa</label>
                    <input
                      type="number"
                      value={changeAmount >= 0 ? changeAmount.toLocaleString() : 0}
                      readOnly
                      className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm bg-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher"
                  className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
                <button
                  onClick={applyVoucher}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  disabled={isLoading}
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            {paymentType === 'BANKING' && selectedBill.status === 'PENDING' && (
              <button
                onClick={confirmBankingPayment}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                disabled={isLoading}
              >
                Xác nhận chuyển khoản
              </button>
            )}
            <button
              onClick={processPayment}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              disabled={isLoading}
            >
              Thanh toán
            </button>
            <select
              onChange={(e) => updateBillStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              value={selectedBill.status || ''}
            >
              <option value="">Chọn trạng thái</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Thêm sản phẩm</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
                  <tr>
                    <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                    <th className="px-6 py-3">Sản phẩm</th>
                    <th className="px-6 py-3">Kích cỡ</th>
                    <th className="px-6 py-3">Màu sắc</th>
                    <th className="px-6 py-3">Số lượng</th>
                    <th className="px-6 py-3">Giá</th>
                    <th className="px-6 py-3">Giá KM</th>
                    <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.map((detail, index) => (
                    <tr key={detail.id} className="border-b hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-3 text-center">{pagination.productDetails.page * pagination.productDetails.size + index + 1}</td>
                      <td className="px-6 py-3 flex items-center space-x-3">
                        {detail.images && detail.images[0] && (
                          <img
                            src={`http://localhost:8080${detail.images[0].url}`}
                            alt={detail.productName}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={() => console.error(`Failed to load image: http://localhost:8080${detail.images[0].url}`)}
                          />
                        )}
                        <div>
                          <p className="font-medium">{detail.productName}</p>
                          <p className="text-xs text-gray-500">Mã: {detail.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3">{detail.sizeName || 'N/A'}</td>
                      <td className="px-6 py-3">{detail.colorName || 'N/A'}</td>
                      <td className="px-6 py-3">{detail.quantity}</td>
                      <td className="px-6 py-3">{(detail.price || 0).toLocaleString()} đ</td>
                      <td className="px-6 py-3">{(detail.promotionalPrice || 0).toLocaleString()} đ</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => addProductToBill(detail.id)}
                          className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePaginationChange('productDetails', pagination.productDetails.page - 1)}
                  disabled={pagination.productDetails.page === 0}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
                  Trang {pagination.productDetails.page + 1} / {pagination.productDetails.totalPages}
                </span>
                <button
                  onClick={() => handlePaginationChange('productDetails', pagination.productDetails.page + 1)}
                  disabled={pagination.productDetails.page + 1 >= pagination.productDetails.totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Voucher Modal */}
      {showSelectVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Chọn Voucher</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
                  <tr>
                    <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                    <th className="px-6 py-3">Mã</th>
                    <th className="px-6 py-3">Tên</th>
                    <th className="px-6 py-3">Loại</th>
                    <th className="px-6 py-3">Giảm giá</th>
                    <th className="px-6 py-3">Đơn tối thiểu</th>
                    <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher, index) => (
                    <tr key={voucher.id} className="border-b hover:bg-indigo-50 transition-colors">
                      <td className="px-6 py-3 text-center">{pagination.vouchers.page * pagination.vouchers.size + index + 1}</td>
                      <td className="px-6 py-3">{voucher.code}</td>
                      <td className="px-6 py-3">{voucher.name}</td>
                      <td className="px-6 py-3">{voucher.type}</td>
                      <td className="px-6 py-3">
                        {voucher.type === 'PERCENTAGE'
                          ? `${voucher.percentageDiscountValue}% (Tối đa ${(voucher.maxDiscountValue || 0).toLocaleString()} đ)`
                          : `${(voucher.fixedDiscountValue || 0).toLocaleString()} đ`}
                      </td>
                      <td className="px-6 py-3">{(voucher.minOrderValue || 0).toLocaleString()} đ</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleVoucherSelect(voucher.code)}
                          className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setShowSelectVoucherModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePaginationChange('vouchers', pagination.vouchers.page - 1)}
                  disabled={pagination.vouchers.page === 0}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
                  Trang {pagination.vouchers.page + 1} / {pagination.vouchers.totalPages}
                </span>
                <button
                  onClick={() => handlePaginationChange('vouchers', pagination.vouchers.page + 1)}
                  disabled={pagination.vouchers.page + 1 >= pagination.vouchers.totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaiQuayAdmin;