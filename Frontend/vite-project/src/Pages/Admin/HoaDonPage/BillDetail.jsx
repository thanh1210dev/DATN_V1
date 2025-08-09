import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HiArrowLeft, HiOutlinePlus, HiOutlineX, HiCheckCircle, HiClock, HiXCircle, HiCurrencyDollar, HiUser, HiOutlineTruck, HiArchive, HiOutlinePrinter } from 'react-icons/hi';
import Select from 'react-select';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const [bill, setBill] = useState(null);
  const [billDetails, setBillDetails] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [customerPayment, setCustomerPayment] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isFullReturn, setIsFullReturn] = useState(true);
  const [returnQuantities, setReturnQuantities] = useState({}); // billDetailId -> qty
  const [returnFiles, setReturnFiles] = useState([]); // attachments for return request
  const [creatingReturn, setCreatingReturn] = useState(false);
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
  const [returnsHistory, setReturnsHistory] = useState([]);

  const handlePrintInvoice = async () => {
    try {
      if (!id) {
        toast.error('Không tìm thấy hóa đơn để in');
        return;
      }
      const base64PDF = await HoaDonApi.printInvoice(id);
      const byteCharacters = atob(base64PDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải hóa đơn thành công');
    } catch (error) {
      toast.error(error.message || 'Lỗi khi in hóa đơn');
    }
  };

  // Có yêu cầu trả hàng đang chờ duyệt không?
  const hasPendingReturn = useMemo(() => {
    try {
      return Array.isArray(returnsHistory) && returnsHistory.some(r => r?.status === 'REQUESTED');
    } catch (_) {
      return false;
    }
  }, [returnsHistory]);

  // Trạng thái chi tiết đơn giản: chỉ 4 trạng thái theo yêu cầu
  const billDetailStatusOptions = [
    { value: 'PENDING', label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PAID', label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    { value: 'RETURNED', label: 'Đã trả hàng', color: 'bg-orange-100 text-orange-800' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  ];

  const orderStatusOptions = [
    { value: 'PENDING', label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRMING', label: 'Đang xác nhận', color: 'bg-blue-100 text-blue-800' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'PACKED', label: 'Đã đóng gói', color: 'bg-purple-100 text-purple-800' },
    { value: 'PAID', label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    { value: 'DELIVERING', label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'DELIVERED', label: 'Đã giao hàng', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-teal-100 text-teal-800' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng', color: 'bg-amber-100 text-amber-800' },
    { value: 'RETURNED', label: 'Đã trả hàng', color: 'bg-orange-100 text-orange-800' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
    { value: 'RETURN_COMPLETED', label: 'Đã trả xong', color: 'bg-pink-100 text-pink-800' },
  ];

  const billTypeOptions = [
    { value: 'OFFLINE', label: 'Tại quầy', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'ONLINE', label: 'Trực tuyến', color: 'bg-lime-100 text-lime-800' },
  ];

  const paymentTypeOptions = [
    { value: 'CASH', label: 'Tiền mặt', color: 'bg-amber-100 text-amber-800' },
    { value: 'COD', label: 'Thanh toán khi nhận hàng', color: 'bg-rose-100 text-rose-800' },
    { value: 'BANKING', label: 'Chuyển khoản', color: 'bg-violet-100 text-violet-800' },
    { value: 'VNPAY', label: 'VNPAY', color: 'bg-emerald-100 text-emerald-800' },
  ];

  // Payment status (tiền tệ) - độc lập với OrderStatus
  const paymentStatusOptions = [
    { value: 'UNPAID', label: 'Chưa thanh toán', color: 'bg-gray-100 text-gray-800' },
    { value: 'PENDING', label: 'Đang chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PAID', label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    { value: 'FAILED', label: 'Thanh toán thất bại', color: 'bg-red-100 text-red-800' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
    { value: 'PARTIALLY_REFUNDED', label: 'Hoàn tiền một phần', color: 'bg-indigo-100 text-indigo-800' },
  ];

  // Fulfillment status (giao vận) - hiển thị/analytics, có thể suy từ OrderStatus
  const fulfillmentStatusOptions = [
  { value: 'PENDING', label: 'Chờ xử lý', color: 'bg-gray-100 text-gray-800' },
  { value: 'CONFIRMING', label: 'Đang xác nhận', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'PACKED', label: 'Đã đóng gói', color: 'bg-purple-100 text-purple-800' },
  { value: 'DELIVERING', label: 'Đang giao hàng', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'DELIVERED', label: 'Đã giao hàng', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'DELIVERY_FAILED', label: 'Giao thất bại', color: 'bg-red-100 text-red-800' },
  { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng', color: 'bg-amber-100 text-amber-800' },
  { value: 'RETURNED', label: 'Đã trả hàng', color: 'bg-orange-100 text-orange-800' },
  { value: 'RETURN_COMPLETED', label: 'Hoàn tất trả hàng', color: 'bg-teal-100 text-teal-800' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  ];

  // Return request status mapping (admin view)
  const returnStatusMap = {
    REQUESTED: { label: 'Đã gửi yêu cầu', color: 'bg-amber-100 text-amber-800' },
    APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Bị từ chối', color: 'bg-red-100 text-red-800' },
    COMPLETED: { label: 'Hoàn tất', color: 'bg-indigo-100 text-indigo-800' },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log(`📄 Fetching bill data for ID: ${id}`);
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
      
      console.log('✅ Bill data loaded:', {
        billType: billData.billType,
        status: billData.status,
        code: billData.code,
        id: billData.id,
        fullBillData: billData
      });
      
      console.log('🔍 Bill Details Data:', billDetailsData.content);
      console.log('🔍 First Bill Detail:', billDetailsData.content?.[0]);
      
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
      console.log(`📊 Fetching order history for bill: ${id}`);
      const historyData = await HoaDonApi.getOrderHistory(id);
      console.log('✅ Order history fetched:', historyData);
      setOrderHistory(historyData);
    } catch (error) {
      console.error('❌ Order history fetch failed:', error);
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
    const { name, item, value } = e.target;
    setProductFilters((prev) => ({ ...prev, [item]: value }));
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

  const handleAutoFillPayment = () => {
    if (!bill || !bill.finalAmount) {
      toast.error('Không thể điền số tiền: Hóa đơn chưa tải');
      return;
    }
    setCustomerPayment(bill.finalAmount.toString());
  };

  // Get available next statuses for dropdown based on current status and bill conditions
  const getAvailableNextStatuses = (currentStatus) => {
    if (!currentStatus) return [];
  // Cho phép thao tác cả các trạng thái trả hàng trong dropdown theo quy trình mong muốn
  const hasDeliveryAddress = !!(bill?.address && bill.address.trim() !== '');

    switch (currentStatus) {
      case 'PENDING':
        // Đơn hàng mới tạo - có thể hủy hoặc xác nhận
        return [
          { value: 'CONFIRMING', label: 'Xác nhận đơn hàng' },
          { value: 'CANCELLED', label: 'Hủy hóa đơn' }
        ];
        
      case 'CONFIRMING':
        // Đang xác nhận - phân biệt theo loại thanh toán
        if (bill?.billType === 'OFFLINE' && (bill?.type === 'CASH' || bill?.type === 'BANKING')) {
          // Tại quầy với CASH hoặc BANKING - thanh toán trước
          return [
            { value: 'PAID', label: 'Đã thanh toán' },
            { value: 'CANCELLED', label: 'Hủy hóa đơn' }
          ];
        } else if (bill?.type === 'COD') {
          // COD - xác nhận trước, thanh toán sau khi giao hàng
          return [
            { value: 'CONFIRMED', label: 'Đã xác nhận' },
            { value: 'CANCELLED', label: 'Hủy hóa đơn' }
          ];
        } else if (bill?.type === 'VNPAY') {
          // VNPAY - thanh toán trước
          return [
            { value: 'PAID', label: 'Đã thanh toán' },
            { value: 'CANCELLED', label: 'Hủy hóa đơn' }
          ];
        } else {
          // Trường hợp khác - mặc định thanh toán trước
          return [
            { value: 'PAID', label: 'Đã thanh toán' },
            { value: 'CANCELLED', label: 'Hủy hóa đơn' }
          ];
        }
        
      case 'CONFIRMED':
        // Đã xác nhận đơn hàng - chuyển sang đóng gói
        return [
          { value: 'PACKED', label: 'Đã đóng gói' },
          { value: 'CANCELLED', label: 'Hủy hóa đơn' }
        ];
        
      case 'PAID':
        // Đã thanh toán - phân biệt theo loại thanh toán và có địa chỉ giao hàng
        if (bill?.billType === 'OFFLINE' && (bill?.type === 'CASH' || bill?.type === 'BANKING')) {
          // Tại quầy với CASH hoặc BANKING - kiểm tra có địa chỉ giao hàng không
          if (hasDeliveryAddress) {
            // Có địa chỉ giao hàng - cần đóng gói và giao hàng
            return [
              { value: 'PACKED', label: 'Đã đóng gói' },
              { value: 'CANCELLED', label: 'Hủy hóa đơn' }
            ];
          } else {
            // Không có địa chỉ - hoàn thành luôn (khách lấy tại quầy)
            return [
              { value: 'COMPLETED', label: 'Hoàn thành' }
            ];
          }
        } else if (bill?.type === 'COD') {
          // COD - đã thanh toán nghĩa là khách đã nhận hàng và thanh toán rồi, hoàn thành luôn
          return [
            { value: 'COMPLETED', label: 'Hoàn thành' }
          ];
        } else if (bill?.type === 'VNPAY') {
          // VNPAY - đã thanh toán trước, cần đóng gói và giao hàng
          if (hasDeliveryAddress) {
            return [
              { value: 'PACKED', label: 'Đã đóng gói' },
              { value: 'CANCELLED', label: 'Hủy hóa đơn' }
            ];
          } else {
            return [
              { value: 'COMPLETED', label: 'Hoàn thành' }
            ];
          }
        } else {
          // Trường hợp khác - kiểm tra có địa chỉ giao hàng
          if (hasDeliveryAddress) {
            return [
              { value: 'PACKED', label: 'Đã đóng gói' },
              { value: 'CANCELLED', label: 'Hủy hóa đơn' }
            ];
          } else {
            return [
              { value: 'COMPLETED', label: 'Hoàn thành' }
            ];
          }
        }
        
      case 'PACKED':
        // Đã đóng gói - chỉ cho giao hàng hoặc hủy
        return [
          { value: 'DELIVERING', label: 'Đang giao hàng' },
          { value: 'CANCELLED', label: 'Hủy hóa đơn' }
        ];
        
      case 'DELIVERING':
        // Đang giao hàng - KHÔNG cho hủy nữa, chỉ cho giao thành công hoặc yêu cầu trả hàng
        return [
          { value: 'DELIVERED', label: 'Đã giao hàng' },
          { value: 'RETURN_REQUESTED', label: 'Khách yêu cầu trả hàng' }
        ];
        
      case 'DELIVERED':
        // Đã giao hàng - phân biệt theo loại thanh toán
        if (bill?.type === 'COD') {
          // COD - khách thanh toán sau khi nhận hàng
          return [
            { value: 'PAID', label: 'Khách đã thanh toán' },
            { value: 'RETURN_REQUESTED', label: 'Khách yêu cầu trả hàng' }
          ];
        } else {
          // Đã thanh toán trước - hoàn thành hoặc trả hàng
          return [
            { value: 'COMPLETED', label: 'Hoàn thành' },
            { value: 'RETURN_REQUESTED', label: 'Khách yêu cầu trả hàng' }
          ];
        }
        
      case 'RETURN_REQUESTED':
        // Yêu cầu trả hàng - có thể duyệt nhận hàng trả về hoặc từ chối để quay lại 'Đã giao hàng'
        return [
          { value: 'RETURNED', label: 'Đã nhận hàng trả về' },
          { value: 'DELIVERED', label: 'Từ chối trả hàng (giao lại)' }
        ];
        
      case 'RETURNED':
        // Đã nhận hàng trả về - tiếp tục hoàn tiền
        return [
          { value: 'REFUNDED', label: 'Đã hoàn tiền' }
        ];
        
      case 'REFUNDED':
        // Đã hoàn tiền - cho phép thu nốt tiền nếu COD chưa thanh toán và còn số tiền phải thu (>0)
        {
          const amountDue = Number(bill?.finalAmount || 0);
          const opts = [{ value: 'RETURN_COMPLETED', label: 'Hoàn tất trả hàng' }];
          if (bill?.type === 'COD' && ['UNPAID', 'REFUNDED'].includes(bill?.paymentStatus) && amountDue > 0) {
            opts.unshift({ value: 'PAID', label: 'Khách đã thanh toán' });
          }
          return opts;
        }
        
      case 'COMPLETED':
      case 'CANCELLED':
        return [];

      case 'RETURN_COMPLETED':
        // Sau khi hoàn tất trả hàng: nếu COD chưa thanh toán và còn số tiền phải thu (>0), cho phép thu tiền (PAID)
        // Luôn cho phép trả hàng lại
        {
          const amountDue = Number(bill?.finalAmount || 0);
          console.log('[RETURN_COMPLETED dropdown]', {
            billType: bill?.type,
            paymentStatus: bill?.paymentStatus,
            finalAmount: bill?.finalAmount,
            showPaid: bill?.type === 'COD' && ['UNPAID', 'REFUNDED'].includes(bill?.paymentStatus) && amountDue > 0
          });
          const opts = [{ value: 'RETURN_REQUESTED', label: 'Khách yêu cầu trả hàng' }];
          if (bill?.type === 'COD' && ['UNPAID', 'REFUNDED'].includes(bill?.paymentStatus) && amountDue > 0) {
            opts.unshift({ value: 'PAID', label: 'Khách đã thanh toán' });
          }
          // Nếu là VNPAY, đã thanh toán, còn sản phẩm chưa trả, cho phép hoàn thành đơn
          if (bill?.type === 'VNPAY' && bill?.paymentStatus === 'PAID' && amountDue > 0) {
            opts.unshift({ value: 'COMPLETED', label: 'Hoàn thành' });
          }
          return opts;
        }
        
      default:
        return [];
    }
  };

  // Get previous status for reverting
  const getPreviousStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'CONFIRMING': return 'PENDING';
      case 'CONFIRMED': return 'CONFIRMING';
      case 'PAID': return 'CONFIRMING';
      case 'PACKED': return 'PAID';
      case 'DELIVERING': return 'PACKED';
      case 'DELIVERED': return 'DELIVERING';
      case 'COMPLETED': return 'DELIVERED';
      case 'RETURN_REQUESTED': return 'DELIVERING';
      case 'RETURNED': return 'RETURN_REQUESTED';
      case 'REFUNDED': return 'RETURNED';
      case 'RETURN_COMPLETED': return 'REFUNDED';
      default: return null;
    }
  };

  // Get return status for processing returns
  const getReturnStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'DELIVERED': return 'RETURN_REQUESTED';
      case 'COMPLETED': return 'RETURN_REQUESTED';
      case 'RETURN_REQUESTED': return 'RETURNED';
      case 'RETURNED': return 'REFUNDED';
      case 'REFUNDED': return 'RETURN_COMPLETED';
      default: return null;
    }
  };

  // Check if can add products to bill (only in early statuses)
  const canAddProducts = (currentStatus) => {
    return ['PENDING', 'CONFIRMING'].includes(currentStatus);
  };

  // Handle status change from dropdown
  const handleStatusChange = async (newStatus) => {
    if (!bill || !newStatus) {
      toast.error('Không thể cập nhật trạng thái');
      return;
    }

    // Nếu đang có phiếu trả hàng chờ duyệt, không cho chuyển trạng thái
    if (hasPendingReturn) {
      toast.error('Đang có yêu cầu trả hàng chưa duyệt. Vui lòng xử lý trước khi chuyển trạng thái.');
      return;
    }

    // If admin chooses "Khách yêu cầu trả hàng" from dropdown -> open return request modal instead of direct status change
    if (newStatus === 'RETURN_REQUESTED') {
      openReturnModal();
      return;
    }

    // Special handling for payment transition
    if (newStatus === 'PAID' && bill.customerPayment < bill.finalAmount) {
      setShowPaymentModal(true);
      return;
    }

    try {
      setLoading(true);
      console.log(`📤 Changing status: ${bill.status} → ${newStatus}`);
      
      await HoaDonApi.updateBillStatus(id, newStatus);
      
      const statusLabel = orderStatusOptions.find(opt => opt.value === newStatus)?.label || newStatus;
      toast.success(`Đã chuyển trạng thái sang: ${statusLabel}`);
      
      fetchData();
      fetchOrderHistory();
    } catch (error) {
      console.error('❌ Status change failed:', error);
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStatusUpdate = async () => {
    console.log('🔄 handleNextStatusUpdate called!');
    
    try {
      console.log('🔄 Inside main try block');
      console.log('🔄 isMountedRef.current:', isMountedRef.current);
      
      // Remove mount check that was preventing status updates
      // if (!isMountedRef.current) {
      //   console.log('🔄 Component unmounted, returning');
      //   return;
      // }
      
      if (!bill || !bill.status) {
        console.log('🔄 No bill or status, showing error');
        toast.error('Không thể cập nhật trạng thái: Hóa đơn chưa tải');
        return;
      }
      
      // Get the first available next status
      const availableStatuses = getAvailableNextStatuses(bill.status);
      const nextStatus = availableStatuses.length > 0 ? availableStatuses[0].value : null;
      
      console.log('🔄 Status Transition Debug:', {
        billType: bill.billType,
        currentStatus: bill.status,
        availableStatuses: availableStatuses,
        nextStatus: nextStatus,
        billId: bill.id
      });
      
      if (!nextStatus) {
        console.log('🔄 No next status available');
        toast.error('Không thể chuyển sang trạng thái tiếp theo');
        return;
      }

      console.log('🔄 Starting status update process...');
      // Skip mount check temporarily for debugging
      setLoading(true);
      console.log('🔄 Set loading to true');
      
      if (nextStatus === 'PAID' && bill.customerPayment < bill.finalAmount) {
        console.log('🔄 Payment modal path - should not happen for PAID->COMPLETED');
        setShowPaymentModal(true);
        setLoading(false);
        return;
      } else {
        console.log('🔄 Normal status update path');
        console.log(`📤 Sending status update request: ${bill.id} -> ${nextStatus}`);
        console.log('📤 Using API endpoint: /bills/' + id + '/status');
        console.log('📤 Request parameters:', { status: nextStatus });
        
        console.log('🔄 About to call HoaDonApi.updateBillStatus...');
        console.log('🔄 Parameters:', { id, nextStatus, idType: typeof id, nextStatusType: typeof nextStatus });
        
        // Add additional safeguards for the API call
        let result;
        try {
          result = await HoaDonApi.updateBillStatus(id, nextStatus);
          console.log('✅ HoaDonApi.updateBillStatus completed:', result);
        } catch (apiError) {
          console.error('❌ HoaDonApi.updateBillStatus failed:', apiError);
          
          // Try to parse the actual error
          let apiErrorMessage = 'Lỗi API không xác định';
          if (apiError?.message) {
            apiErrorMessage = apiError.message;
          } else if (apiError?.response?.data?.message) {
            apiErrorMessage = apiError.response.data.message;
          } else if (typeof apiError === 'string') {
            apiErrorMessage = apiError;
          }
          
          throw new Error(`API Error: ${apiErrorMessage}`);
        }
        
        // Remove mount check to allow UI updates
        // if (!isMountedRef.current) return;
        
        // Safe status label lookup
        let statusLabel = nextStatus;
        try {
          const statusOption = orderStatusOptions.find(opt => opt.value === nextStatus);
          statusLabel = statusOption?.label || nextStatus;
        } catch (labelError) {
          console.warn('❌ Error finding status label:', labelError);
        }
        
        toast.success(`Cập nhật trạng thái thành ${statusLabel}`);
        
        console.log('🔄 About to refresh data...');
        try {
          // Remove mount check to allow data refresh
          // if (!isMountedRef.current) return;
          await fetchData();
          console.log('✅ fetchData completed');
        } catch (fetchError) {
          console.error('❌ fetchData failed:', fetchError);
        }
        
        try {
          // Remove mount check to allow history refresh
          // if (!isMountedRef.current) return;
          await fetchOrderHistory();
          console.log('✅ fetchOrderHistory completed');
        } catch (historyError) {
          console.error('❌ fetchOrderHistory failed:', historyError);
        }
        console.log('✅ Data refresh completed');
      }
    } catch (error) {
      console.error('❌ Status update failed:', error);
      
      // Safe error handling to prevent React crashes
      let errorMessage = 'Lỗi không xác định';
      let errorDetails = {};
      
      try {
        errorDetails = {
          message: error?.message || 'Unknown error',
          response: error?.response || null,
          stack: error?.stack || 'No stack trace',
          errorType: typeof error,
          errorConstructor: error?.constructor?.name || 'Unknown'
        };
        
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        console.error('❌ Error details:', errorDetails);
      } catch (detailError) {
        console.error('❌ Error processing error details:', detailError);
        errorMessage = 'Có lỗi xảy ra khi cập nhật trạng thái';
      }
      
      toast.error('Lỗi khi cập nhật trạng thái: ' + errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
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

  const handleReturnOrder = async () => {
    if (!bill || !bill.status) {
      toast.error('Không thể trả hàng: Hóa đơn chưa tải');
      return;
    }

    if (hasPendingReturn) {
      toast.error('Đang có yêu cầu trả hàng chưa duyệt. Không thể tạo thêm.');
      return;
    }
    
    const returnStatus = getReturnStatus(bill.status);
    if (!returnStatus) {
      toast.error('Không thể trả hàng ở trạng thái hiện tại');
      return;
    }

    if (!window.confirm('Xác nhận khách hàng không nhận hàng và trả về kho?')) {
      return;
    }

    try {
      setLoading(true);
      console.log(`📤 Processing return: ${bill.id} -> ${returnStatus}`);
      await HoaDonApi.updateBillStatus(id, returnStatus);
      toast.success('Đã xử lý trả hàng thành công');
      fetchData();
      fetchOrderHistory();
    } catch (error) {
      console.error('❌ Return processing failed:', error);
      toast.error('Lỗi khi xử lý trả hàng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerPaymentChange = (e) => {
    setCustomerPayment(e.target.value);
  };

  const handlePaymentSubmit = async () => {
    if (!customerPayment || isNaN(customerPayment) || Number(customerPayment) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      setLoading(true);
      
      // Update customer payment first
      await HoaDonApi.updateCustomerPayment(id, Number(customerPayment));
      
      // Then update status to PAID
      await HoaDonApi.updateBillStatus(id, 'PAID');
      
      toast.success('Đã cập nhật thanh toán thành công');
      setShowPaymentModal(false);
      setCustomerPayment('');
      fetchData();
      fetchOrderHistory();
    } catch (error) {
      console.error('❌ Payment update failed:', error);
      toast.error('Lỗi khi cập nhật thanh toán: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  // Lấy đơn giá an toàn: ưu tiên promotionalPrice nếu hợp lệ (>0),
  // nếu không thì fallback về price; tránh trường hợp promotionalPrice rỗng/NaN làm tổng = 0
  const getSafeUnitPrice = (row) => {
    const promo = Number(row?.promotionalPrice);
    const base = Number(row?.price);
    if (Number.isFinite(promo) && promo > 0) return promo;
    return Number.isFinite(base) ? base : 0;
  };

  const calculateRemainingAmount = () => {
    if (!customerPayment || isNaN(customerPayment) || Number(customerPayment) <= 0) {
      return bill?.finalAmount || 0;
    }
    return Math.max(0, (bill?.finalAmount || 0) - Number(customerPayment));
  };

  const openReturnModal = async () => {
    console.log('🟠 openReturnModal clicked');
    if (!bill) {
      toast.error('Chưa tải được hóa đơn');
      return;
    }
    if (hasPendingReturn) {
      toast.error('Đang có yêu cầu trả hàng chưa duyệt. Không thể tạo thêm.');
      return;
    }
    const allowed = ['PAID','DELIVERED','COMPLETED','RETURN_REQUESTED','RETURNED','RETURN_COMPLETED'];
    let canReturn = allowed.includes(bill.status);
    if (!canReturn) {
      toast.error('Chỉ cho phép trả hàng khi đơn đã thanh toán/đã giao/hoàn thành/đã trả xong');
      return;
    }
    setShowReturnModal(true);
    try {
      const data = await HoaDonApi.getReturnsByBill(id);
      setReturnsHistory(data || []);
    } catch (e) {
      console.warn('⚠️ getReturnsByBill failed:', e);
    }
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnReason('');
    setIsFullReturn(true);
    setReturnQuantities({});
  setReturnFiles([]);
  setCreatingReturn(false);
  };

  const handleReturnQtyChange = (billDetailId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setReturnQuantities(prev => ({ ...prev, [billDetailId]: qty }));
  };

  // Toggle select helper for partial return (checkbox)
  const toggleSelectReturnItem = (billDetailId, checked, maxQty) => {
    setReturnQuantities(prev => ({ ...prev, [billDetailId]: checked ? Math.min(1, maxQty || 1) : 0 }));
  };

  // Returns management (admin)
  const loadReturns = async () => {
    if (!id) return;
    try {
      const data = await HoaDonApi.getReturnsByBill(id);
      setReturnsHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('⚠️ loadReturns failed:', e?.message || e);
    }
  };

  const handleApproveReturn = async (returnId) => {
    try {
      setLoading(true);
      await HoaDonApi.approveReturn(returnId);
      toast.success('Đã duyệt yêu cầu trả hàng');
      await loadReturns();
      await fetchData();
      await fetchOrderHistory();
    } catch (e) {
      toast.error(e.message || 'Lỗi khi duyệt yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReturn = async (returnId) => {
    const reason = window.prompt('Nhập lý do từ chối:', 'Không đủ điều kiện trả hàng');
    if (reason === null) return;
    try {
      setLoading(true);
      await HoaDonApi.rejectReturn(returnId, reason || 'Từ chối');
      toast.success('Đã từ chối yêu cầu trả hàng');
      await loadReturns();
      await fetchData();
      await fetchOrderHistory();
    } catch (e) {
      toast.error(e.message || 'Lỗi khi từ chối yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReturn = async (returnId) => {
    if (!window.confirm('Xác nhận hoàn tất trả hàng? Thao tác này sẽ hoàn kho/cập nhật thanh toán.')) return;
    try {
      setLoading(true);
      await HoaDonApi.completeReturn(returnId);
      toast.success('Đã hoàn tất trả hàng');
      await loadReturns();
      await fetchData();
      await fetchOrderHistory();
    } catch (e) {
      toast.error(e.message || 'Lỗi khi hoàn tất trả hàng');
    } finally {
      setLoading(false);
    }
  };

  const isImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return /(\.png|\.jpg|\.jpeg|\.webp|\.gif)$/i.test(url);
  };

  const submitReturn = async () => {
    if (!bill) return;
    if (hasPendingReturn) {
      toast.error('Đang có yêu cầu trả hàng chưa duyệt. Không thể tạo thêm.');
      return;
    }
    const payload = {
      reason: returnReason || 'Khách trả hàng',
      fullReturn: isFullReturn,
      items: [],
    };
    if (!isFullReturn) {
      payload.items = billDetails
        .filter(it => it.status !== 'RETURNED')
        .map(it => ({
          billDetailId: it.id,
          quantity: Number(returnQuantities[it.id] || 0) || 0,
          max: (it.remainingQty != null ? it.remainingQty : it.quantity) || 0
        }))
        .filter(row => row.quantity > 0 && row.max > 0)
        .map(row => ({ billDetailId: row.billDetailId, quantity: Math.min(row.quantity, row.max) }));
      if (payload.items.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 sản phẩm và số lượng');
        return;
      }
    } else {
      // Trả toàn bộ: gửi kèm đầy đủ các dòng sản phẩm với số lượng đã mua
      payload.items = billDetails
        .filter(it => it.status !== 'RETURNED')
        .map(it => ({ billDetailId: it.id, quantity: ((it.remainingQty != null ? it.remainingQty : it.quantity) || 0) }));
    }
    try {
  setCreatingReturn(true);
  console.log('🟠 createReturnWithFiles payload:', payload, 'files:', returnFiles);
  await HoaDonApi.createReturnWithFiles(id, payload, returnFiles);
  toast.success('Đã gửi yêu cầu trả hàng');
      closeReturnModal();
  await fetchData();
  await fetchOrderHistory();
  await loadReturns();
    } catch (err) {
      console.error('❌ Return flow failed:', err);
      toast.error(err.message || 'Lỗi khi trả hàng');
    } finally {
  setCreatingReturn(false);
    }
  };

  // Helper: translate enum tokens inside descriptions to Vietnamese labels
  const translateActionDescription = (desc) => {
  if (!desc) return 'Không có';
    let text = String(desc);

    const orderMap = {};
    try {
      (orderStatusOptions || []).forEach(opt => {
        if (opt?.value && opt?.label) orderMap[opt.value] = opt.label;
      });
    } catch (_) {}

    const paymentStatusMap = {
      UNPAID: 'Chưa thanh toán',
      PENDING: 'Đang chờ thanh toán',
      PAID: 'Đã thanh toán',
      FAILED: 'Thanh toán thất bại',
      REFUNDED: 'Đã hoàn tiền',
      PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
    };
    const paymentTypeMap = {
      CASH: 'Tiền mặt',
      COD: 'Thanh toán khi nhận hàng',
      BANKING: 'Chuyển khoản',
      VNPAY: 'VNPAY',
    };

    const replaceByMap = (str, mapObj) => {
      let out = str;
      Object.entries(mapObj).forEach(([key, label]) => {
        try {
          const re = new RegExp(`\\b${key}\\b`, 'g');
          out = out.replace(re, label);
        } catch (_) {}
      });
      return out;
    };

    text = replaceByMap(text, orderMap);
    text = replaceByMap(text, paymentStatusMap);
    text = replaceByMap(text, paymentTypeMap);
    return text;
  };

  useEffect(() => {
    if (!id || id === 'undefined' || isNaN(id)) {
      toast.error('ID hóa đơn không hợp lệ');
      navigate('/admin/bills');
      return;
    }
    fetchData();
    fetchOrderHistory();
  loadReturns();
  }, [id, navigate, pagination.page, productFilters]);

  useEffect(() => {
    if (showAddressModal) {
      fetchProvinces();
      if (addressForm.provinceId) fetchDistricts(addressForm.provinceId);
      if (addressForm.districtId) fetchWards(addressForm.districtId);
    }
  }, [showAddressModal, addressForm.provinceId, addressForm.districtId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize partial return quantities when switching from full to partial
  useEffect(() => {
    if (!isFullReturn && Array.isArray(billDetails)) {
      const init = {};
      billDetails.forEach(bd => { init[bd.id] = 0; });
      setReturnQuantities(init);
    }
  }, [isFullReturn, billDetails]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không có';
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? 'Không có'
      : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const filteredStatusOptions = bill?.billType === 'ONLINE'
    ? orderStatusOptions
    : orderStatusOptions.filter(opt => !['DELIVERING', 'RETURNED', 'REFUNDED', 'RETURN_COMPLETED'].includes(opt.value));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <HiClock className="text-yellow-600" />;
      case 'CONFIRMING': return <HiCheckCircle className="text-blue-600" />;
      case 'CONFIRMED': return <HiCheckCircle className="text-cyan-600" />;
      case 'PACKED': return <HiArchive className="text-purple-600" />;
      case 'PAID': return <HiCurrencyDollar className="text-green-600" />;
      case 'DELIVERING': return <HiOutlineTruck className="text-indigo-600" />;
      case 'DELIVERED': return <HiCheckCircle className="text-emerald-600" />;
      case 'COMPLETED': return <HiCheckCircle className="text-teal-600" />;
      case 'CANCELLED': return <HiXCircle className="text-red-600" />;
      case 'RETURN_REQUESTED': return <HiClock className="text-amber-600" />;
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
          <h2 className="text-3xl font-semibold text-gray-900">Chi tiết hóa đơn #{bill?.code || 'Không có'}</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            >
              <HiClock className="mr-2" /> Xem lịch sử
            </button>
            <button
              onClick={handlePrintInvoice}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              title="In hóa đơn"
            >
              <HiOutlinePrinter className="mr-2" /> In hóa đơn
            </button>
            <button
              onClick={() => navigate('/admin/bills')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <HiArrowLeft className="mr-2" /> Quay lại
            </button>
            <button
              onClick={openReturnModal}
              className="flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
            >
              Trả hàng
            </button>
          </div>
        </div>

        {/* Timeline Section */}
        {(bill?.billType === 'ONLINE' || bill?.billType === 'OFFLINE') && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Lịch sử trạng thái</h3>
              <div className="flex space-x-4">
                {/* Status Change Dropdown */}
                {getAvailableNextStatuses(bill?.status).length > 0 && (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Chuyển trạng thái:
                    </label>
                    <Select
                      options={getAvailableNextStatuses(bill?.status)}
                      value={null}
                      onChange={(option) => handleStatusChange(option.value)}
                      className="min-w-64"
                      placeholder={hasPendingReturn ? 'Đang chờ duyệt trả hàng...' : 'Chọn trạng thái tiếp theo...'}
                      isDisabled={loading || hasPendingReturn}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#9ca3af' },
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected 
                            ? '#3b82f6' 
                            : state.isFocused 
                            ? '#eff6ff' 
                            : 'white',
                          color: state.isSelected ? 'white' : '#374151',
                        }),
                      }}
                    />
                  </div>
                )}
                
                {/* No available transitions message */}
                {getAvailableNextStatuses(bill?.status).length === 0 && (
                  <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                    Đơn hàng đã hoàn tất - không thể chuyển trạng thái
                  </div>
                )}
              </div>
            </div>
            {hasPendingReturn && (
              <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Đang có yêu cầu trả hàng chưa duyệt. Vui lòng duyệt hoặc từ chối trước khi chuyển trạng thái hay tạo yêu cầu mới.
              </div>
            )}
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
                        {orderStatusOptions.find(opt => opt.value === history.statusOrder)?.label || 'Không có'}
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
                  <span className="text-gray-900">{bill?.code || 'Không có'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Loại hóa đơn:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${billTypeOptions.find(opt => opt.value === bill?.billType)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {billTypeOptions.find(opt => opt.value === bill?.billType)?.label || bill?.billType || 'Không có'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Trạng thái hóa đơn:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${orderStatusOptions.find(opt => opt.value === bill?.status)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {orderStatusOptions.find(opt => opt.value === bill?.status)?.label || bill?.status || 'Không có'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Trạng thái thanh toán:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusOptions.find(opt => opt.value === bill?.paymentStatus)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {paymentStatusOptions.find(opt => opt.value === bill?.paymentStatus)?.label || bill?.paymentStatus || 'Không có'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Trạng thái giao vận:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${fulfillmentStatusOptions.find(opt => opt.value === bill?.fulfillmentStatus)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {fulfillmentStatusOptions.find(opt => opt.value === bill?.fulfillmentStatus)?.label || bill?.fulfillmentStatus || 'Không có'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Hình thức thanh toán:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentTypeOptions.find(opt => opt.value === bill?.type)?.color || 'bg-gray-200 text-gray-800'}`}>
                    {paymentTypeOptions.find(opt => opt.value === bill?.type)?.label || bill?.type || 'Không có'}
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
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-indigo-900 mb-6">Thông tin khách hàng & khuyến mãi</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tên khách hàng:</span>
                  <span className="text-gray-900">{bill?.customerName || 'Không có'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Số điện thoại:</span>
                  <span className="text-gray-900">{bill?.phoneNumber || 'Không có'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Địa chỉ:</span>
                  <span className="text-gray-900">{bill?.address || 'Không có'}</span>
                </div>
                {bill?.billType === 'ONLINE' && (bill?.status === 'PENDING' || bill?.status === 'CONFIRMING') && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    >
                      <HiUser className="mr-2" /> Cập nhật địa chỉ
                    </button>
                    <button
                      onClick={openReturnModal}
                      disabled={hasPendingReturn}
                      title={hasPendingReturn ? 'Đang có yêu cầu trả hàng chờ duyệt' : ''}
                      className={`flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 transition-colors ${hasPendingReturn ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'}`}
                    >
                      Trả hàng
                    </button>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Tên khuyến mãi:</span>
                  <span className="text-gray-900">{bill?.voucherName || 'Không có'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Số tiền giảm KM:</span>
                  <span className="text-gray-900">{formatMoney(bill?.voucherDiscountAmount)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-40">Nhân viên tạo:</span>
                  <span className="text-gray-900">{bill?.employeeName || 'Không có'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Detail Items */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Chi tiết sản phẩm</h3>
            {canAddProducts(bill?.status) && (
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
                    <th className="px-6 py-3">Kích cỡ</th>
                    <th className="px-6 py-3">Màu</th>
                    <th className="px-6 py-3">Số lượng</th>
                    <th className="px-6 py-3">Đơn giá</th>
                    <th className="px-6 py-3">Tổng</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    {canAddProducts(bill?.status) && (
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
                            <span className="text-gray-500">Không có</span>
                          )}
                          <span>{item.productName || 'Không có'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.productDetailCode || 'Không có'}</td>
                      <td className="px-6 py-4">{item.productSize || 'Không có'}</td>
                      <td className="px-6 py-4">{item.productColor || 'Không có'}</td>
                      <td className="px-6 py-4">{item.quantity || '0'}</td>
                      <td className="px-6 py-4">{formatMoney(getSafeUnitPrice(item))}</td>
                      <td className="px-6 py-4">{formatMoney(getSafeUnitPrice(item) * Number(item.quantity || 0))}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${billDetailStatusOptions.find(opt => opt.value === item.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                          {billDetailStatusOptions.find(opt => opt.value === item.status)?.label || item.status || 'Không có'}
                        </span>
                      </td>
                      {canAddProducts(bill?.status) && (
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
                      <th className="px-6 py-3">Kích cỡ</th>
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
                              <span className="text-gray-500">Không có</span>
                            )}
                            <span>{detail.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{detail.code}</td>
                        <td className="px-6 py-4">{detail.sizeName || 'Không có'}</td>
                        <td className="px-6 py-4">{detail.colorName || 'Không có'}</td>
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
                            {orderStatusOptions.find(opt => opt.value === history.statusOrder)?.label || history.statusOrder || 'Không có'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Mô tả: {translateActionDescription(history.actionDescription || 'Không có')}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Người thực hiện: {history.createdBy || history.updatedBy || history.actorName || 'Hệ thống'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">{formatDate(history.createdAt)}</div>
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

        {/* Return Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Xử lý trả hàng</h3>
                <button onClick={closeReturnModal} className="text-gray-500 hover:text-gray-700"><span className="sr-only">Đóng</span>×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" checked={isFullReturn} onChange={(e) => setIsFullReturn(e.target.checked)} />
                    <span>Trả toàn bộ</span>
                  </label>
                </div>

                {!isFullReturn && (
                  <div className="border rounded-md divide-y">
                    {billDetails
                      .filter((bd) => bd.status !== 'RETURNED')
                      .map((bd) => (
                      <div key={bd.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                          <div className="font-medium">{bd.productName || bd.detailProduct?.code || 'SP #' + bd.id}</div>
                          <div className="text-sm text-gray-500">SL mua: {bd.quantity} | Giá: {(bd.promotionalPrice ?? bd.price)?.toLocaleString('vi-VN')}</div>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={(returnQuantities[bd.id] || 0) > 0}
                              onChange={(e) => toggleSelectReturnItem(bd.id, e.target.checked, bd.quantity)}
                            />
                            <span>Chọn</span>
                          </label>
                        </div>
                        <div className="col-span-4 flex items-center justify-end">
                          <input
                            type="number"
                            min={0}
                            max={bd.quantity}
                            value={returnQuantities[bd.id] || 0}
                            onChange={(e) => handleReturnQtyChange(bd.id, e.target.value)}
                            className="w-24 border rounded px-2 py-1 text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Lý do</label>
                  <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} placeholder="Nhập lý do trả hàng..." />
                </div>

                {returnsHistory?.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium mb-2">Lịch sử trả hàng</div>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {returnsHistory.map(r => (
                        <li key={r.id}>#{r.id} • {returnStatusMap[r.status]?.label || r.status} • {formatDate(r.createdAt)} • Hoàn: {Number(r.totalRefundAmount || 0).toLocaleString('vi-VN')}₫</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={closeReturnModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Hủy</button>
                <button onClick={submitReturn} className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700">Xác nhận</button>
              </div>
            </div>
          </div>
        )}

        {/* Return Requests (Admin) */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Yêu cầu trả hàng</h3>
            <button
              onClick={loadReturns}
              className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200"
              disabled={loading}
            >Làm mới</button>
          </div>
          {returnsHistory && returnsHistory.length > 0 ? (
            <div className="space-y-4">
              {returnsHistory.map((r) => (() => {
                // Fallback compute total refund from items if API doesn't populate it
                let computedRefund = 0;
                if (Array.isArray(r.items)) {
                  computedRefund = r.items.reduce((sum, it) => {
                    const bdId = it.billDetailId ?? it.id;
                    const bd = (billDetails || []).find(b => b.id === bdId);
                    const unitPrice = (typeof it.unitPrice === 'number' ? it.unitPrice : (bd?.promotionalPrice ?? bd?.price)) || 0;
                    const qty = it.quantity || 0;
                    const lineTotal = (typeof it.totalAmount === 'number' ? it.totalAmount : unitPrice * qty) || 0;
                    return sum + lineTotal;
                  }, 0);
                }
                const displayRefund = (typeof r.totalRefundAmount === 'number' && r.totalRefundAmount > 0)
                  ? r.totalRefundAmount
                  : computedRefund;

                return (
                <div key={r.id} className="border rounded-md p-4">
                  <div className="flex flex-wrap justify-between gap-3 items-center">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Mã phiếu: <span className="font-medium">#{r.id}</span></div>
                      <div className="text-sm text-gray-600">Trạng thái: <span className={`px-2 py-1 rounded-full text-xs font-medium ${returnStatusMap[r.status]?.color || 'bg-gray-100 text-gray-800'}`}>{returnStatusMap[r.status]?.label || r.status || 'Không có'}</span></div>
                      <div className="text-sm text-gray-600">Tổng hoàn: <span className="font-medium text-red-600">{formatMoney(displayRefund)}</span></div>
                      <div className="text-xs text-gray-500">Tạo lúc: {formatDate(r.createdAt)}</div>
                      {r.reason && <div className="text-sm text-gray-600">Lý do: <span className="font-medium">{r.reason}</span></div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'REQUESTED' && (
                        <>
                          <button onClick={() => handleApproveReturn(r.id)} className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700" disabled={loading}>Duyệt</button>
                          <button onClick={() => handleRejectReturn(r.id)} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700" disabled={loading}>Từ chối</button>
                        </>
                      )}
                      {/* Sau khi duyệt, không hiển thị nút Hoàn tất ở đây theo yêu cầu */}
                    </div>
                  </div>
                  {Array.isArray(r.attachments) && r.attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {r.attachments.map((url, idx) => (
                        <div key={idx} className="border rounded overflow-hidden bg-gray-50">
                          {isImageUrl(url) ? (
                            <img src={url.startsWith('http') ? url : `http://localhost:8080${url}`} alt={`attachment-${idx}`} className="w-full h-32 object-cover" />
                          ) : (
                            <video controls className="w-full h-32">
                              <source src={url.startsWith('http') ? url : `http://localhost:8080${url}`} />
                            </video>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(r.items) && r.items.length > 0 && (() => {
                    // Enrich return items with bill detail info for clearer display and computed totals
                    const viewItems = r.items.map((it) => {
                      const bdId = it.billDetailId ?? it.id;
                      const bd = (billDetails || []).find(b => b.id === bdId);
                      const unitPrice = (typeof it.unitPrice === 'number' ? it.unitPrice : (bd?.promotionalPrice ?? bd?.price)) || 0;
                      const lineTotal = (typeof it.totalAmount === 'number' ? it.totalAmount : unitPrice * (it.quantity || 0)) || 0;
                      return {
                        key: it.id ?? `${bdId}`,
                        code: bd?.productDetailCode || it.productDetailCode || (bdId != null ? `#${bdId}` : 'Không có'),
                        name: bd?.productName || it.productName || 'Không có',
                        size: bd?.productSize || it.size || '—',
                        color: bd?.productColor || it.color || '—',
                        image: Array.isArray(bd?.productImage) && bd.productImage[0]?.url ? `http://localhost:8080${bd.productImage[0].url}` : null,
                        qty: it.quantity || 0,
                        unitPrice,
                        lineTotal,
                      };
                    });

                    return (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Sản phẩm</th>
                              <th className="px-3 py-2">Mã SP</th>
                              <th className="px-3 py-2">Kích cỡ</th>
                              <th className="px-3 py-2">Màu</th>
                              <th className="px-3 py-2">SL trả</th>
                              <th className="px-3 py-2">Đơn giá</th>
                              <th className="px-3 py-2">Tổng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewItems.map((row, i) => (
                              <tr key={row.key} className="border-t">
                                <td className="px-3 py-2">{i + 1}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    {row.image ? (
                                      <img src={row.image} alt={row.name} className="w-8 h-8 object-cover rounded" />
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                    <span className="font-medium text-gray-800">{row.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">{row.code}</td>
                                <td className="px-3 py-2">{row.size}</td>
                                <td className="px-3 py-2">{row.color}</td>
                                <td className="px-3 py-2">{row.qty}</td>
                                <td className="px-3 py-2">{formatMoney(row.unitPrice)}</td>
                                <td className="px-3 py-2">{formatMoney(row.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
                )})())}
            </div>
          ) : (
            <p className="text-center text-gray-500">Chưa có yêu cầu trả hàng</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetail;
// Thêm sản phẩm