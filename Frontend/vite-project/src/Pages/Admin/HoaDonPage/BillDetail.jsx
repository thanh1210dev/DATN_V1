import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HiArrowLeft, HiOutlinePlus, HiOutlineX, HiCheckCircle, HiClock, HiXCircle, HiCurrencyDollar, HiUser, HiOutlineTruck } from 'react-icons/hi';
import Select from 'react-select';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [billDetails, setBillDetails] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerPayment, setCustomerPayment] = useState('');
  const [addressForm, setAddressForm] = useState({
    customerName: '',
    phoneNumber: '',
    provinceId: '',
    districtId: '',
    wardCode: '',
    addressDetail: '',
    desiredDate: '',
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [productFilters, setProductFilters] = useState({
    code: '',
    name: '',
    sizeName: '',
    colorName: '',
    minPrice: '',
    maxPrice: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
  });

  const orderStatusOptions = [
    { value: 'PENDING', label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRMING', label: 'Đang xác nhận', color: 'bg-blue-100 text-blue-800' },
    { value: 'PAID', label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    { value: 'DELIVERING', label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-teal-100 text-teal-800' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    { value: 'RETURNED', label: 'Đã trả hàng', color: 'bg-orange-100 text-orange-800' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
    { value: 'RETURN_COMPLETED', label: 'Đã trả xong', color: 'bg-pink-100 text-pink-800' },
  ];

  const billTypeOptions = [
    { value: 'OFFLINE', label: 'Tại quầy', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'ONLINE', label: 'Online', color: 'bg-lime-100 text-lime-800' },
  ];

  const paymentTypeOptions = [
    { value: 'CASH', label: 'Tiền mặt', color: 'bg-amber-100 text-amber-800' },
    { value: 'COD', label: 'Thanh toán khi nhận hàng', color: 'bg-rose-100 text-rose-800' },
    { value: 'BANKING', label: 'Chuyển khoản', color: 'bg-violet-100 text-violet-800' },
    { value: 'VNPAY', label: 'VNPAY', color: 'bg-emerald-100 text-emerald-800' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billData, billDetailsData, productData] = await Promise.all([
        HoaDonApi.getBill(id),
        HoaDonApi.getBillDetails(id, 0, 10),
        HoaDonApi.getProductDetails(
          pagination.page,
          pagination.size,
          productFilters.code,
          productFilters.name,
          null,
          productFilters.sizeName,
          productFilters.colorName
        ),
      ]);
      setBill(billData);
      setBillDetails(billDetailsData.content || []);
      setProducts(productData.content || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: productData.totalPages || 1,
      }));
      setAddressForm({
        customerName: billData.customerName || '',
        phoneNumber: billData.phoneNumber || '',
        provinceId: billData.customerInfor?.provinceId || '',
        districtId: billData.customerInfor?.districtId || '',
        wardCode: billData.customerInfor?.wardCode || '',
        addressDetail: billData.customerInfor?.address || '',
        desiredDate: billData.desiredDate ? new Date(billData.desiredDate).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      toast.error(error.message || 'Lỗi khi tải dữ liệu');
      if (error.message.includes('Không tìm thấy hóa đơn') || error.message === 'ID hóa đơn không hợp lệ') {
        navigate('/admin/bills');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const historyData = await HoaDonApi.getOrderHistory(id);
      setOrderHistory(historyData);
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử đơn hàng: ' + error.message);
    }
  };

  const fetchProvinces = async () => {
    try {
      const provinceData = await HoaDonApi.getProvinces();
      setProvinces(provinceData);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách tỉnh/thành: ' + error.message);
    }
  };

  const fetchDistricts = async (provinceId) => {
    if (!provinceId) return;
    try {
      const districtData = await HoaDonApi.getDistricts(provinceId);
      setDistricts(districtData);
      setWards([]);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách quận/huyện: ' + error.message);
    }
  };

  const fetchWards = async (districtId) => {
    if (!districtId) return;
    try {
      const wardData = await HoaDonApi.getWards(districtId);
      setWards(wardData);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách phường/xã: ' + error.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setProductFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleQuantityChange = (productId, value) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, parseInt(value) || 1),
    }));
  };

  const handleAddProduct = async (productId, quantity) => {
    try {
      const request = {
        productDetailId: productId,
        quantity: quantity,
      };
      await HoaDonApi.addProductToBill(id, request);
      toast.success('Thêm sản phẩm thành công');
      fetchData();
      setShowAddProductModal(false);
    } catch (error) {
      toast.error('Lỗi khi thêm sản phẩm: ' + error.message);
    }
  };

  const handleRemoveProduct = async (billDetailId) => {
    try {
      await HoaDonApi.removeProductFromBill(billDetailId);
      toast.success('Xóa sản phẩm thành công');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm: ' + error.message);
    }
  };

  const handleUpdateCODPayment = async () => {
    const amount = prompt('Nhập số tiền thanh toán COD:');
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    try {
      await HoaDonApi.updateCODPayment(id, Number(amount));
      toast.success('Cập nhật số tiền COD thành công');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi cập nhật số tiền COD: ' + error.message);
    }
  };

  const handleAutoFillPayment = () => {
    if (!bill || !bill.finalAmount) {
      toast.error('Không thể điền số tiền: Hóa đơn chưa tải');
      return;
    }
    setCustomerPayment(bill.finalAmount.toString());
  };

  const getNextStatus = (currentStatus) => {
    if (!currentStatus) return null;
    const normalFlow = ['CONFIRMING', 'DELIVERING', 'PAID', 'COMPLETED'];
    const returnFlow = ['RETURNED', 'REFUNDED', 'RETURN_COMPLETED'];
    
    if (normalFlow.includes(currentStatus)) {
      const currentIndex = normalFlow.indexOf(currentStatus);
      return currentIndex < normalFlow.length - 1 ? normalFlow[currentIndex + 1] : null;
    } else if (returnFlow.includes(currentStatus)) {
      const currentIndex = returnFlow.indexOf(currentStatus);
      return currentIndex < returnFlow.length - 1 ? returnFlow[currentIndex + 1] : null;
    }
    return null;
  };

  const getPreviousStatus = (currentStatus) => {
    if (!currentStatus) return null;
    const normalFlow = ['CONFIRMING', 'DELIVERING', 'PAID', 'COMPLETED'];
    const returnFlow = ['RETURNED', 'REFUNDED', 'RETURN_COMPLETED'];
    
    if (normalFlow.includes(currentStatus)) {
      const currentIndex = normalFlow.indexOf(currentStatus);
      return currentIndex > 0 ? normalFlow[currentIndex - 1] : null;
    } else if (returnFlow.includes(currentStatus)) {
      const currentIndex = returnFlow.indexOf(currentStatus);
      return currentIndex > 0 ? returnFlow[currentIndex - 1] : null;
    }
    return null;
  };

  const handleNextStatusUpdate = async () => {
    if (!bill || !bill.status) {
      toast.error('Không thể cập nhật trạng thái: Hóa đơn chưa tải');
      return;
    }
    
    const nextStatus = getNextStatus(bill.status);
    if (!nextStatus) {
      toast.error('Không thể chuyển sang trạng thái tiếp theo');
      return;
    }

    try {
      setLoading(true);
      if (nextStatus === 'PAID' && bill.customerPayment < bill.finalAmount) {
        setShowPaymentModal(true);
      } else {
        await HoaDonApi.updateBillStatus(id, nextStatus);
        toast.success(`Cập nhật trạng thái thành ${orderStatusOptions.find(opt => opt.value === nextStatus)?.label || nextStatus}`);
        fetchData();
        fetchOrderHistory();
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousStatusUpdate = async () => {
    if (!bill || !bill.status) {
      toast.error('Không thể cập nhật trạng thái: Hóa đơn chưa tải');
      return;
    }
    
    const previousStatus = getPreviousStatus(bill.status);
    if (!previousStatus) {
      toast.error('Không thể quay lại trạng thái trước đó');
      return;
    }

    try {
      setLoading(true);
      await HoaDonApi.updateBillStatus(id, previousStatus);
      toast.success(`Khôi phục trạng thái thành ${orderStatusOptions.find(opt => opt.value === previousStatus)?.label || previousStatus}`);
      fetchData();
      fetchOrderHistory();
    } catch (error) {
      toast.error('Lỗi khi khôi phục trạng thái: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!customerPayment || isNaN(customerPayment) || Number(customerPayment) <= 0) {
      toast.error('Số tiền khách trả không hợp lệ');
      return;
    }
    try {
      setLoading(true);
      const paymentAmount = Number(customerPayment);
      await HoaDonApi.updateCustomerPayment(id, paymentAmount);
      await HoaDonApi.updateBillStatus(id, 'PAID');
      setShowPaymentModal(false);
      setCustomerPayment('');
      toast.success('Cập nhật thanh toán và trạng thái thành công');
      fetchData();
      fetchOrderHistory();
    } catch (error) {
      toast.error('Lỗi khi cập nhật thanh toán: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerPaymentChange = (e) => {
    setCustomerPayment(e.target.value);
  };

  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'provinceId') {
      setAddressForm((prev) => ({ ...prev, districtId: '', wardCode: '' }));
      fetchDistricts(value);
    } else if (field === 'districtId') {
      setAddressForm((prev) => ({ ...prev, wardCode: '' }));
      fetchWards(value);
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateAddress = async () => {
    if (!addressForm.customerName || !addressForm.phoneNumber || !addressForm.provinceId || 
        !addressForm.districtId || !addressForm.wardCode || !addressForm.addressDetail) {
      toast.error('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }
    try {
      setLoading(true);
      const request = {
        billId: parseInt(id),
        customerName: addressForm.customerName,
        phoneNumber: addressForm.phoneNumber,
        provinceId: parseInt(addressForm.provinceId),
        districtId: parseInt(addressForm.districtId),
        wardCode: addressForm.wardCode,
        addressDetail: addressForm.addressDetail,
        desiredDate: addressForm.desiredDate ? `${addressForm.desiredDate}T00:00:00Z` : null,
      };
      await HoaDonApi.updateBillAddress(id, request);
      toast.success('Cập nhật địa chỉ thành công');
      setShowAddressModal(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi cập nhật địa chỉ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return amount == null ? '0 ₫' : Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const calculateRemainingAmount = () => {
    if (!customerPayment || isNaN(customerPayment) || Number(customerPayment) <= 0) {
      return bill?.finalAmount || 0;
    }
    return Math.max(0, (bill?.finalAmount || 0) - Number(customerPayment));
  };

  useEffect(() => {
    if (!id || id === 'undefined' || isNaN(id)) {
      toast.error('ID hóa đơn không hợp lệ');
      navigate('/admin/bills');
      return;
    }
    fetchData();
    fetchOrderHistory();
  }, [id, navigate, pagination.page, productFilters]);

  useEffect(() => {
    if (showAddressModal) {
      fetchProvinces();
      if (addressForm.provinceId) fetchDistricts(addressForm.provinceId);
      if (addressForm.districtId) fetchWards(addressForm.districtId);
    }
  }, [showAddressModal, addressForm.provinceId, addressForm.districtId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
  };

  const filteredStatusOptions = bill?.billType === 'ONLINE'
    ? orderStatusOptions
    : orderStatusOptions.filter(opt => !['DELIVERING', 'COMPLETED', 'RETURNED', 'REFUNDED', 'RETURN_COMPLETED'].includes(opt.value));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <HiClock className="text-yellow-600" />;
      case 'CONFIRMING': return <HiCheckCircle className="text-blue-600" />;
      case 'PAID': return <HiCurrencyDollar className="text-green-600" />;
      case 'DELIVERING': return <HiOutlineTruck className="text-indigo-600" />;
      case 'COMPLETED': return <HiCheckCircle className="text-teal-600" />;
      case 'CANCELLED': return <HiXCircle className="text-red-600" />;
      case 'RETURNED': return <HiArrowLeft className="text-orange-600" />;
      case 'REFUNDED': return <HiCurrencyDollar className="text-purple-600" />;
      case 'RETURN_COMPLETED': return <HiCheckCircle className="text-pink-600" />;
      default: return <HiUser className="text-gray-600" />;
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Chi tiết hóa đơn #{bill?.code || 'N/A'}</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
              disabled={bill?.billType !== 'ONLINE'}
            >
              <HiClock className="mr-2" /> Xem lịch sử
            </button>
            <button
              onClick={() => navigate('/admin/bills')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <HiArrowLeft className="mr-2" /> Quay lại
            </button>
          </div>
        </div>

        {/* Timeline Section */}
        {bill?.billType === 'ONLINE' && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Lịch sử trạng thái</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handlePreviousStatusUpdate}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                  disabled={loading || !getPreviousStatus(bill?.status)}
                >
                  <HiArrowLeft className="mr-2" />
                  {getPreviousStatus(bill?.status)
                    ? `Quay lại ${orderStatusOptions.find(opt => opt.value === getPreviousStatus(bill?.status))?.label || 'N/A'}`
                    : 'Không thể quay lại'}
                </button>
                <button
                  onClick={handleNextStatusUpdate}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                  disabled={loading || !getNextStatus(bill?.status)}
                >
                  <HiCheckCircle className="mr-2" />
                  {getNextStatus(bill?.status)
                    ? `Chuyển sang ${orderStatusOptions.find(opt => opt.value === getNextStatus(bill?.status))?.label || 'N/A'}`
                    : 'Không thể chuyển trạng thái'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-center space-x-6">
                {orderHistory.map((history, index) => (
                  <div key={history.id} className="flex-shrink-0 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          orderStatusOptions.find(opt => opt.value === history.statusOrder)?.color || 'bg-gray-200'
                        } text-white`}
                      >
                        {getStatusIcon(history.statusOrder)}
                      </div>
                      <span className="mt-2 text-sm text-gray-600">{formatDate(history.createdAt)}</span>
                      <span className="text-sm font-medium text-gray-800 mt-1">
                        {orderStatusOptions.find(opt => opt.value === history.statusOrder)?.label || 'N/A'}
                      </span>
                    </div>
                    {index < orderHistory.length - 1 && (
                      <div className="flex-1 h-1 bg-gray-300 mx-4">
                        <div
                          className={`h-full ${
                            index % 2 === 0 ? 'bg-yellow-400' : index % 3 === 0 ? 'bg-purple-400' : 'bg-teal-400'
                          }`}
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bill Information */}
        <div className="bg-white shadow-xl rounded-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-indigo-900 mb-6">Thông tin hóa đơn</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Mã hóa đơn:</span>
                  <span className="text-gray-900">{bill?.code || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Loại hóa đơn:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${billTypeOptions.find(opt => opt.value === bill?.billType)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {billTypeOptions.find(opt => opt.value === bill?.billType)?.label || bill?.billType || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Trạng thái hóa đơn:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${orderStatusOptions.find(opt => opt.value === bill?.status)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {orderStatusOptions.find(opt => opt.value === bill?.status)?.label || bill?.status || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Hình thức thanh toán:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentTypeOptions.find(opt => opt.value === bill?.type)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {paymentTypeOptions.find(opt => opt.value === bill?.type)?.label || bill?.type || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tổng tiền:</span>
                  <span className="text-gray-900">{formatMoney(bill?.totalMoney)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tiền khách trả:</span>
                  <span className="text-gray-900">{formatMoney(bill?.customerPayment)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tiền giảm:</span>
                  <span className="text-gray-900">{formatMoney(bill?.reductionAmount)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Phí vận chuyển:</span>
                  <span className="text-gray-900">{formatMoney(bill?.moneyShip)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tổng tiền cuối cùng:</span>
                  <span className="text-red-700 font-semibold">{formatMoney(bill?.finalAmount)}</span>
                </div>
                {bill?.type === 'COD' && (
                  <div className="flex items-center">
                    <button
                      onClick={handleUpdateCODPayment}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <HiCurrencyDollar className="mr-2" /> Cập nhật COD
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-indigo-900 mb-6">Thông tin khách hàng & khuyến mãi</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tên khách hàng:</span>
                  <span className="text-gray-900">{bill?.customerName || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Số điện thoại:</span>
                  <span className="text-gray-900">{bill?.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Địa chỉ:</span>
                  <span className="text-gray-900">{bill?.address || 'N/A'}</span>
                </div>
                {bill?.billType === 'ONLINE' && (bill?.status === 'PENDING' || bill?.status === 'CONFIRMING') && (
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    >
                      <HiUser className="mr-2" /> Cập nhật địa chỉ
                    </button>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Mã khuyến mãi:</span>
                  <span className="text-gray-900">{bill?.voucherCode || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tên khuyến mãi:</span>
                  <span className="text-gray-900">{bill?.voucherName || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Số tiền giảm KM:</span>
                  <span className="text-gray-900">{formatMoney(bill?.voucherDiscountAmount)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Nhân viên tạo:</span>
                  <span className="text-gray-900">{bill?.employeeName || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Detail Items */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Chi tiết sản phẩm</h3>
            {bill?.status === 'CONFIRMING' && (
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                <HiOutlinePlus className="mr-2" /> Thêm sản phẩm
              </button>
            )}
          </div>
          {billDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-16">#</th>
                    <th className="px-6 py-3">Sản phẩm</th>
                    <th className="px-6 py-3">Mã SP</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Màu</th>
                    <th className="px-6 py-3">Số lượng</th>
                    <th className="px-6 py-3">Đơn giá</th>
                    <th className="px-6 py-3">Tổng</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    {bill?.status === 'CONFIRMING' && (
                      <th className="px-6 py-3 w-24">Hành động</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {billDetails.map((item, index) => (
                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {item.productImage && Array.isArray(item.productImage) && item.productImage.length > 0 ? (
                            <img
                              src={`http://localhost:8080${item.productImage[0].url}`}
                              alt={`Product ${item.id}`}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                          <span>{item.productName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.productDetailCode || 'N/A'}</td>
                      <td className="px-6 py-4">{item.productSize || 'N/A'}</td>
                      <td className="px-6 py-4">{item.productColor || 'N/A'}</td>
                      <td className="px-6 py-4">{item.quantity || '0'}</td>
                      <td className="px-6 py-4">{formatMoney(item.price)}</td>
                      <td className="px-6 py-4">{formatMoney(item.promotionalPrice * item.quantity)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusOptions.find(opt => opt.value === item.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                          {orderStatusOptions.find(opt => opt.value === item.typeOrder)?.label || item.typeOrder || 'N/A'}
                        </span>
                      </td>
                      {bill?.status === 'CONFIRMING' && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleRemoveProduct(item.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={loading}
                          >
                            <HiOutlineX size={20} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Không có chi tiết sản phẩm</p>
          )}
        </div>

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Thêm sản phẩm</h3>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiOutlineX size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {Object.entries(productFilters).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key === 'code'
                        ? 'Mã SP'
                        : key === 'name'
                        ? 'Tên SP'
                        : key === 'sizeName'
                        ? 'Kích cỡ'
                        : key === 'colorName'
                        ? 'Màu sắc'
                        : key === 'minPrice'
                        ? 'Giá tối thiểu'
                        : 'Giá tối đa'}
                    </label>
                    <input
                      type={key.includes('Price') ? 'number' : 'text'}
                      name={key}
                      value={value}
                      onChange={handleFilterChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Nhập ${key.includes('Price') ? 'giá trị' : key}`}
                      min={key.includes('Price') ? '0' : undefined}
                    />
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 w-16">#</th>
                      <th className="px-6 py-3">Sản phẩm</th>
                      <th className="px-6 py-3">Mã SP</th>
                      <th className="px-6 py-3">Size</th>
                      <th className="px-6 py-3">Màu</th>
                      <th className="px-6 py-3">Số lượng</th>
                      <th className="px-6 py-3">Số lượng tồn</th>
                      <th className="px-6 py-3">Giá</th>
                      <th className="px-6 py-3">Giá KM</th>
                      <th className="px-6 py-3 w-24">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((detail, index) => (
                      <tr key={detail.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-center">{pagination.page * pagination.size + index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {detail.images && Array.isArray(detail.images) && detail.images.length > 0 ? (
                              <img
                                src={`http://localhost:8080${detail.images[0].url}`}
                                alt={`Product ${detail.id}`}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                            <span>{detail.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{detail.code}</td>
                        <td className="px-6 py-4">{detail.sizeName || 'N/A'}</td>
                        <td className="px-6 py-4">{detail.colorName || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={productQuantities[detail.id] || 1}
                            onChange={(e) => handleQuantityChange(detail.id, e.target.value)}
                            className="w-20 text-center rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            min="1"
                            max={detail.quantity}
                          />
                        </td>
                        <td className="px-6 py-4">{detail.quantity}</td>
                        <td className="px-6 py-4">{formatMoney(detail.price)}</td>
                        <td className="px-6 py-4">{formatMoney(detail.promotionalPrice)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleAddProduct(detail.id, productQuantities[detail.id] || 1)}
                            className="text-indigo-600 hover:text-indigo-800"
                            disabled={loading}
                          >
                            <HiOutlinePlus size={20} />
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
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                >
                  Đóng
                </button>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 0}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    ← Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang {pagination.page + 1} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page + 1 >= pagination.totalPages}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Tiếp →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Nhập số tiền khách trả</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setCustomerPayment('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiOutlineX size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền khách trả</label>
                  <input
                    type="number"
                    value={customerPayment}
                    onChange={handleCustomerPaymentChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập số tiền"
                    min="0"
                  />
                </div>
                <button
                  onClick={handleAutoFillPayment}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  <HiCurrencyDollar className="mr-2" /> Đã trả hết
                </button>
                {customerPayment && !isNaN(customerPayment) && Number(customerPayment) >= 0 && (
                  <div className="text-sm text-gray-600">
                    <p>Số tiền khách đã trả: <span className="font-medium">{formatMoney(Number(customerPayment))}</span></p>
                    <p>Bạn cần thu thêm: <span className="font-medium text-red-600">{formatMoney(calculateRemainingAmount())}</span></p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setCustomerPayment('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  disabled={loading}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order History Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Lịch sử đơn hàng #{bill?.code}</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiOutlineX size={20} />
                </button>
              </div>
              {orderHistory.length > 0 ? (
                <div className="space-y-4">
                  {orderHistory.map((history) => (
                    <div key={history.id} className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800 flex items-center">
                            <span className={`mr-2 px-2 py-1 rounded-full text-xs ${orderStatusOptions.find(opt => opt.value === history.statusOrder)?.color || 'bg-gray-100 text-gray-800'}`}>
                              {getStatusIcon(history.statusOrder)}
                            </span>
                            {orderStatusOptions.find(opt => opt.value === history.statusOrder)?.label || history.statusOrder || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Mô tả: {history.actionDescription || 'N/A'}</p>
                          <p className="text-sm text-gray-600 mt-1">Thời gian: {formatDate(history.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Người thực hiện: {history.createdBy || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Không có lịch sử đơn hàng</p>
              )}
            </div>
          </div>
        )}

        {/* Address Update Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Cập nhật địa chỉ</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiOutlineX size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                  <input
                    type="text"
                    name="customerName"
                    value={addressForm.customerName}
                    onChange={handleAddressInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={addressForm.phoneNumber}
                    onChange={handleAddressInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                  <Select
                    options={provinces.map((province) => ({
                      value: province.ProvinceID,
                      label: province.ProvinceName,
                    }))}
                    value={provinces.find((p) => p.ProvinceID === addressForm.provinceId)
                      ? { value: addressForm.provinceId, label: provinces.find((p) => p.ProvinceID === addressForm.provinceId).ProvinceName }
                      : null}
                    onChange={(option) => handleAddressChange('provinceId', option.value)}
                    className="text-sm"
                    placeholder="Chọn tỉnh/thành phố"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#9ca3af' },
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
                    value={districts.find((d) => d.DistrictID === addressForm.districtId)
                      ? { value: addressForm.districtId, label: districts.find((d) => d.DistrictID === addressForm.districtId).DistrictName }
                      : null}
                    onChange={(option) => handleAddressChange('districtId', option.value)}
                    className="text-sm"
                    placeholder="Chọn quận/huyện"
                    isDisabled={!addressForm.provinceId}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#9ca3af' },
                      }),
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                  <Select
                    options={wards.map((ward) => ({
                      value: ward.WardCode,
                      label: ward.WardName,
                    }))}
                    value={wards.find((w) => w.WardCode === addressForm.wardCode)
                      ? { value: addressForm.wardCode, label: wards.find((w) => w.WardCode === addressForm.wardCode).WardName }
                      : null}
                    onChange={(option) => handleAddressChange('wardCode', option.value)}
                    className="text-sm"
                    placeholder="Chọn phường/xã"
                    isDisabled={!addressForm.districtId}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#9ca3af' },
                      }),
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    name="addressDetail"
                    value={addressForm.addressDetail}
                    onChange={handleAddressInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nhập địa chỉ chi tiết"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao mong muốn</label>
                  <input
                    type="date"
                    name="desiredDate"
                    value={addressForm.desiredDate}
                    onChange={handleAddressInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Chọn ngày giao"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateAddress}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  disabled={loading}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillDetail;