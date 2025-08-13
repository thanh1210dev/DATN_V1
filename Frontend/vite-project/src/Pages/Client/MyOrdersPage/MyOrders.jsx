import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';
import { getUserIdByEmail } from '../../../utils/userUtils';

// Danh sách trạng thái cố định (đặt ngoài component để không tạo mới mỗi render)
const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả', color: 'bg-gray-200 text-gray-800' },
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

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});

  // orderStatusOptions cố định (memo hóa để đảm bảo ref ổn định nếu cần)
  const orderStatusOptions = useMemo(() => ORDER_STATUS_OPTIONS, []);
  const getStatusMeta = (value) => ORDER_STATUS_OPTIONS.find(o => o.value === value);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      
      console.log('Fetch orders - Current user:', user); // Debug log
      console.log('Fetch orders - Token exists:', !!token); // Debug log
      
      if (!user || !token) {
        console.log('No auth data, redirecting to login'); // Debug log
        toast.error('Vui lòng đăng nhập để xem đơn hàng', { position: 'top-right', autoClose: 3000 });
        navigate('/login');
        return;
      }
      
      // Thử cả 2 cách lấy userId  
      const userId = user?.id || localStorage.getItem('userId');
      console.log('Using userId:', userId); // Debug log
      
      if (!userId) {
        console.log('No userId found, redirecting to login'); // Debug log
        toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
      

      let finalUserId = userId;
      
      // Nếu userId là email, convert sang số
      if (typeof userId === 'string' && userId.includes('@')) {
        console.log('🔍 [ORDERS] Converting email to numeric ID...');
        try {
          finalUserId = await getUserIdByEmail(userId);
          console.log('🔍 [ORDERS] Got numeric userId:', finalUserId);
        } catch (error) {
          console.log('🔍 [ORDERS] Failed to get numeric userId, keeping email for bills API:', error.message);
          // Giữ nguyên email vì bills API có thể accept email
          finalUserId = userId;
        }
      }
      
      let url = `/bills/customer/${finalUserId}?page=${currentPage}&size=10`;
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      
      console.log('API URL:', url); // Debug log
      
      try {
        const response = await axiosInstance.get(url);
        console.log('API Response:', response.data); // Debug log
        
        setOrders(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } catch (apiError) {
        console.log('Primary API failed, trying fallback API...'); // Debug log
        
        // Fallback to old API if the new one fails
        const fallbackUrl = `/cart-checkout/bills?userId=${finalUserId}&page=${currentPage}&size=10`;
        console.log('Fallback API URL:', fallbackUrl); // Debug log
        
        const fallbackResponse = await axiosInstance.get(fallbackUrl);
        console.log('Fallback API Response:', fallbackResponse.data); // Debug log
        
        // Handle different response structures
        const orders = fallbackResponse.data.content || fallbackResponse.data || [];
        setOrders(orders);
        setTotalPages(fallbackResponse.data.totalPages || 1);
        setTotalElements(fallbackResponse.data.totalElements || orders.length);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      console.error('Error response:', error.response?.data); // Debug log
      
      // Nếu lỗi 401 (Unauthorized) thì redirect về login
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
      
      toast.error('Không thể tải danh sách đơn hàng', { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, navigate]);

  // Lấy tổng số đơn theo trạng thái (đưa lên trước useEffect để tránh ReferenceError)
  const fetchStatusCounts = useCallback(async () => {
    try {
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      if (!user || !token) return;
      let userId = user?.id || localStorage.getItem('userId');
      if (!userId) return;
      if (typeof userId === 'string' && userId.includes('@')) {
        try { userId = await getUserIdByEmail(userId); } catch { /* ignore */ }
      }
      const counts = {};
    for (const opt of ORDER_STATUS_OPTIONS) {
        try {
          const url = `/bills/customer/${userId}?page=0&size=1${opt.value ? `&status=${opt.value}` : ''}`;
          const res = await axiosInstance.get(url);
          counts[opt.value] = res.data.totalElements || 0;
        } catch { counts[opt.value] = 0; }
      }
      setStatusCounts(counts);
    } catch { /* silent */ }
  }, []); // không phụ thuộc vào array tạo mới để tránh loop

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    console.log('Auth check - User:', user); // Debug log
    console.log('Auth check - Token:', token); // Debug log
    
    // Kiểm tra cả user và token
    if (!user || !token) {
      console.log('No user or token, redirecting to login'); // Debug log
      toast.error('Vui lòng đăng nhập để xem đơn hàng', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
      return;
    }
    
    // Kiểm tra token có hợp lệ không
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp < currentTime) {
        console.log('Token expired, redirecting to login'); // Debug log
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout(); // Clear expired data
        navigate('/login');
        return;
      }
    } catch (error) {
      console.log('Invalid token, redirecting to login'); // Debug log
      toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
      AuthService.logout();
      navigate('/login');
      return;
    }
    
    fetchOrders();
    fetchStatusCounts();
  }, [fetchOrders, fetchStatusCounts, navigate]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(0);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('vi-VN') + ' VND' || '0 VND';
  };

  // Mua lại đơn hàng: chỉ cho đơn COMPLETED. Lấy chi tiết và add từng sản phẩm vào giỏ.
  const handleReorder = async (orderId) => {
    try {
      // 1. Auth + userId
      const user = AuthService.getCurrentUser();
      const token = localStorage.getItem('token');
      if (!user || !token) {
        toast.error('Vui lòng đăng nhập');
        navigate('/login');
        return;
      }
      let userId = user.id || localStorage.getItem('userId');
      if (!userId) {
        toast.error('Không tìm thấy người dùng');
        return;
      }
      if (typeof userId === 'string' && userId.includes('@')) {
        try { userId = await getUserIdByEmail(userId); } catch { /* ignore */ }
      }

      // 2. Lấy chi tiết đơn hàng qua BillController (/bills/{id}).
      //    Endpoint cũ /cart-checkout/bill/{id} không tồn tại -> gây 404.
      let items = [];
      try {
        const billRes = await axiosInstance.get(`/bills/${orderId}`); // baseURL đã có /api
        items = Array.isArray(billRes.data?.items) ? billRes.data.items : [];
      } catch (e) {
        console.log('[REORDER] /bills/{id} failed, fallback details page API', e.message);
      }

      // Fallback: /bills/{id}/details (phân trang) nếu items trống
      if (!items.length) {
        try {
          const detailPageRes = await axiosInstance.get(`/bills/${orderId}/details?page=0&size=1000`);
          items = Array.isArray(detailPageRes.data?.content) ? detailPageRes.data.content : [];
        } catch (e) {
          console.log('[REORDER] Fallback /details failed', e.message);
        }
      }

      if (!items.length) {
        toast.warn('Đơn hàng không có sản phẩm hợp lệ để mua lại');
        return;
      }

      // 3. Gom nhóm theo productDetailId để tránh gọi API lặp
      const grouped = new Map();
      for (const it of items) {
        const pdId = it.productDetailId || it.productDetail?.id || it.id; // fallback
        if (!pdId) continue;
        const qty = it.quantity || 1;
        const name = it.productName || 'Sản phẩm';
        if (!grouped.has(pdId)) grouped.set(pdId, { totalWanted: 0, name });
        grouped.get(pdId).totalWanted += qty;
      }
      if (grouped.size === 0) {
        toast.warn('Không tìm thấy sản phẩm khả dụng trong đơn này');
        return;
      }

      // 4. Lấy tồn kho từng productDetail (song song)
      const results = await Promise.all(Array.from(grouped.entries()).map(async ([pdId, info]) => {
        try {
          const res = await axiosInstance.get(`/product-details/${pdId}`); // đúng endpoint plural
          const available = res.data?.quantity ?? 0; // trường backend là quantity
          return { pdId, name: info.name, wanted: info.totalWanted, available };
        } catch (err) {
          return { pdId, name: info.name, wanted: info.totalWanted, available: 0, error: err };
        }
      }));

      // 5. Thêm vào giỏ (tuần tự để tránh race server nếu cần)
      let added = 0;
      const warnings = [];
      for (const r of results) {
        if (r.error) {
          warnings.push(`${r.name} lỗi tải tồn kho`);
          continue;
        }
        if (r.available <= 0) {
          warnings.push(`${r.name} hết hàng`);
          continue;
        }
        const addQty = Math.min(r.wanted, r.available);
        if (addQty < r.wanted) warnings.push(`${r.name} chỉ thêm ${addQty}/${r.wanted}`);
        try {
          if (addQty > 0) {
            await axiosInstance.post(`/cart-checkout/cart/add?userId=${userId}&productDetailId=${r.pdId}&quantity=${addQty}`);
            added++;
          }
        } catch (err) {
          warnings.push(`${r.name} lỗi thêm: ${(err.response?.data?.message)||'không thể thêm'}`);
        }
      }

      if (added === 0) {
        toast.error('Không thể thêm sản phẩm nào (hết hàng hoặc lỗi)');
        if (warnings.length) toast.warn(warnings.slice(0,4).join('\n') + (warnings.length>4 ? ' ...' : ''), { autoClose: 5000 });
        return;
      }
      toast.success(`Đã thêm ${added} sản phẩm vào giỏ`);
      if (warnings.length) toast.warn(warnings.slice(0,4).join('\n') + (warnings.length>4 ? ' ...' : ''), { autoClose: 5000 });
      navigate('/cart');
    } catch (error) {
      toast.error('Không thể mua lại: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          <p className="text-gray-600 mt-2">
            Theo dõi và quản lý các đơn hàng của bạn
            {AuthService.getCurrentUser()?.role === 'ADMIN' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Admin View
              </span>
            )}
          </p>
        </div>

        {/* Tabs trạng thái giống Admin */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          {/* Mobile dropdown */}
          <div className="sm:hidden mb-3">
            <label htmlFor="order-status-filter" className="sr-only">Trạng thái đơn hàng</label>
            <select
              id="order-status-filter"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {orderStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label} ({opt.value === '' ? totalElements : (statusCounts[opt.value] ?? 0)})</option>
              ))}
            </select>
          </div>
          {/* Desktop pills */}
          <div className="hidden sm:flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {orderStatusOptions.map(opt => {
              const active = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${active ? `${opt.color} border-gray-300 ring-1 ring-indigo-300` : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                >
                  <span className="flex items-center gap-1">
                    <span>{opt.label}</span>
                    <span className="text-xs font-semibold text-purple-700">({opt.value === '' ? totalElements : (statusCounts[opt.value] || 0)})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có đơn hàng</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedStatus ? `Không có đơn hàng nào ở trạng thái "${getStatusMeta(selectedStatus)?.label || selectedStatus}"` : 'Bạn chưa có đơn hàng nào'}
              </p>
              <div className="mt-6">
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Bắt đầu mua sắm
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Đơn hàng #{order.code}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Đặt ngày: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusMeta(order.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                      {getStatusMeta(order.status)?.label || order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Người nhận</p>
                      <p className="text-sm text-gray-900">{order.customerName}</p>
                      <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                      <p className="text-sm text-gray-900">{order.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Địa chỉ giao hàng</p>
                      <p className="text-sm text-gray-900">{order.address}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tổng tiền</p>
                      <p className="text-lg font-semibold text-indigo-600">{formatPrice(order.finalAmount)}</p>
                      {order.reductionAmount > 0 && (
                        <p className="text-sm text-green-600">Đã giảm: {formatPrice(order.reductionAmount)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Phương thức thanh toán: <span className="font-medium">{order.type}</span>
                    </div>
                    <div className="flex space-x-3">
                      <Link
                        to={`/order/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Xem chi tiết
                      </Link>
                      {order.status === 'PENDING' && (
                        <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                          Hủy đơn
                        </button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <button
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          onClick={()=>handleReorder(order.id)}
                        >
                          Mua lại
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{' '}
                  <span className="font-medium">{currentPage * 10 + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * 10, totalElements)}
                  </span>{' '}
                  trong{' '}
                  <span className="font-medium">{totalElements}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Trước</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i;
                    } else if (currentPage < 3) {
                      pageNumber = i;
                    } else if (currentPage > totalPages - 3) {
                      pageNumber = totalPages - 5 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sau</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
