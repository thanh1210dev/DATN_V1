import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Kiểm tra authentication
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
          toast.error('Vui lòng đăng nhập để xem đơn hàng', { position: 'top-right', autoClose: 3000 });
          navigate('/login');
          return;
        }
        
        // Kiểm tra token còn hợp lệ không
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp < currentTime) {
            toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
            AuthService.logout();
            navigate('/login');
            return;
          }
        } catch (error) {
          toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          navigate('/login');
          return;
        }
        
        const userId = user.id;
        if (!userId) {
          toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
          AuthService.logout();
          navigate('/login');
          return;
        }
        let url = `/bills/customer/${userId}?page=${page}&size=${size}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        const response = await axiosInstance.get(url);
        setOrders(response.data.content || []);
      } catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error);
        toast.error('Không thể tải danh sách đơn hàng', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchOrders();
  }, [page, size, statusFilter]);

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'CONFIRMING', label: 'Đang xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PACKED', label: 'Đã đóng gói' },
    { value: 'DELIVERING', label: 'Đang giao hàng' },
    { value: 'DELIVERED', label: 'Đã giao hàng' },
    { value: 'PAID', label: 'Đã thanh toán' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
    { value: 'RETURN_REQUESTED', label: 'Yêu cầu trả hàng' },
    { value: 'RETURNED', label: 'Đã trả hàng' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền' },
    { value: 'PARTIALLY_REFUNDED', label: 'Đã hoàn tiền một phần' },
    { value: 'RETURN_COMPLETED', label: 'Đã trả xong' },
    { value: 'DELIVERY_FAILED', label: 'Giao hàng thất bại' },
  ];

  // Mapping trạng thái đơn hàng sang tiếng Việt (đồng bộ với admin)
  const statusMapping = {
    PENDING: 'Chờ xử lý',
    CONFIRMING: 'Đang xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKED: 'Đã đóng gói',
    DELIVERING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    RETURN_REQUESTED: 'Yêu cầu trả hàng',
    RETURNED: 'Đã trả hàng',
    REFUNDED: 'Đã hoàn tiền',
    PARTIALLY_REFUNDED: 'Đã hoàn tiền một phần',
    RETURN_COMPLETED: 'Đã trả xong',
    DELIVERY_FAILED: 'Giao hàng thất bại',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Đơn Hàng Của Tôi</h2>
        <div className="mb-6 w-full">
          <div className="flex flex-wrap gap-2 justify-center">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(0); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-gray-300
                  ${statusFilter === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {orders.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 text-sm font-semibold text-gray-700">
              <div>Mã đơn hàng</div>
              <div>Ngày đặt</div>
              <div>Tạm tính</div>
              <div>Giảm giá</div>
              <div>Trạng thái</div>
              <div className="text-right">Hành động</div>
            </div>
            {orders.map((order) => (
              <div key={order.id} className="grid grid-cols-6 gap-4 p-4 border-t">
                <div className="text-sm text-gray-900">#{order.code}</div>
                <div className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</div>
                <div className="text-sm text-gray-900">{order.totalMoney.toLocaleString('vi-VN')} VND</div>
                <div className="text-sm text-green-600">
                  {order.reductionAmount > 0 ? `-${order.reductionAmount.toLocaleString('vi-VN')} VND` : 'Không có'}
                </div>
                <div className="text-sm text-indigo-600">{statusMapping[order.status] || order.status || 'N/A'}</div>
                <div className="text-right">
                  <Link
                    to={`/order/${order.id}`}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-300"
              disabled={page === 0}
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
              Trang {page + 1}
            </span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition duration-300"
              disabled={orders.length < size}
            >
              Tiếp →
            </button>
          </div>
          <select
            value={size}
            onChange={(e) => {
              setSize(parseInt(e.target.value));
              setPage(0);
            }}
            className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;