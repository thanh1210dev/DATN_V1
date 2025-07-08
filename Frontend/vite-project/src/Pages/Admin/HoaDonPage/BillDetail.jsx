import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HiArrowLeft } from 'react-icons/hi';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [billDetails, setBillDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vietnamese labels and colors for OrderStatus, BillType, and PaymentType
  const orderStatusOptions = [
    { value: '', label: 'Tất cả', color: 'bg-gray-200 text-gray-800' },
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
    { value: 'BANKING', label: 'Chuyển khoản', color: 'bg-violet-100 text-violet-800' },
    { value: 'VNPAY', label: 'VNPAY', color: 'bg-emerald-100 text-emerald-800' },
  ];

  // Fetch bill and bill details
  const fetchBillDetails = async () => {
    setLoading(true);
    try {
      const [billData, billDetailsData] = await Promise.all([
        HoaDonApi.getBill(id),
        HoaDonApi.getBillDetails(id, 0, 10), // Fetch first page, 10 items
      ]);
      console.log('Bill Details:', billData);
      console.log('Bill Detail Items:', billDetailsData.content);
      setBill(billData);
      setBillDetails(billDetailsData.content || []);
    } catch (error) {
      toast.error(error);
      if (error === 'ID hóa đơn không hợp lệ' || error.includes('Không tìm thấy hóa đơn')) {
        navigate('/admin/bills');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || id === 'undefined' || isNaN(id)) {
      toast.error('ID hóa đơn không hợp lệ');
      console.error('Invalid bill ID:', id);
      navigate('/admin/bills');
      return;
    }
    fetchBillDetails();
  }, [id, navigate]);

  // Format date safely Quay lại
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime()) || date.getTime() < 24 * 60 * 60 * 1000) {
      return 'N/A';
    }
    return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
  };

  // Format money safely
  const formatMoney = (amount) => {
    if (amount == null) return '0 ₫';
    return Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
        <p className="text-center text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
        <p className="text-center text-red-500">Không tìm thấy hóa đơn</p>
        <button
          onClick={() => navigate('/admin/danh-sach-hoa-don')}
          className="mt-4 flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <HiArrowLeft className="mr-2" /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <style>
        {billDetails.map(item => `
          @keyframes slide-${item.id} {
            0% { transform: translateX(0); }
            25% { transform: translateX(-${item.images?.length > 1 ? 48 : 0}px); }
            50% { transform: translateX(-${item.images?.length > 1 ? 48 : 0}px); }
            75% { transform: translateX(0); }
            100% { transform: translateX(0); }
          }
        `).join('')}
      </style>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Chi tiết hóa đơn #{bill.code}</h2>
        <button
          onClick={() => navigate('/admin/danh-sach-hoa-don')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <HiArrowLeft className="mr-2" /> Quay lại
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin hóa đơn</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Mã hóa đơn:</span> {bill.code || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Trạng thái:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    orderStatusOptions.find((opt) => opt.value === bill.status)?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {orderStatusOptions.find((opt) => opt.value === bill.status)?.label || bill.status || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Loại hóa đơn:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    billTypeOptions.find((opt) => opt.value === bill.billType)?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {billTypeOptions.find((opt) => opt.value === bill.billType)?.label || bill.billType || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Hình thức thanh toán:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    paymentTypeOptions.find((opt) => opt.value === bill.type)?.color || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {paymentTypeOptions.find((opt) => opt.value === bill.type)?.label || bill.type || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tổng tiền:</span> {formatMoney(bill.totalMoney)}
              </div>
              <div>
                <span className="font-medium text-gray-700">Tiền giảm:</span> {formatMoney(bill.reductionAmount)}
              </div>
              <div>
                <span className="font-medium text-gray-700">Phí vận chuyển:</span> {formatMoney(bill.moneyShip)}
              </div>
              <div>
                <span className="font-medium text-gray-700">Tổng tiền cuối cùng:</span>{' '}
                <span className="text-red-800 font-semibold">{formatMoney(bill.finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Customer and Voucher Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin khách hàng & khuyến mãi</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Tên khách hàng:</span> {bill.customerName || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Số điện thoại:</span> {bill.phoneNumber || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Địa chỉ:</span> {bill.address || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Mã khuyến mãi:</span> {bill.voucherCode || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Tên khuyến mãi:</span> {bill.voucherName || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Số tiền giảm khuyến mãi:</span> {formatMoney(bill.voucherDiscountAmount)}
              </div>
              <div>
                <span className="font-medium text-gray-700">Nhân viên tạo:</span> {bill.employeeName || 'N/A'}
              </div>
            </div>
          </div>

          {/* Date Information */}
         
        </div>
      </div>

      {/* Bill Detail Items */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết sản phẩm</h3>
        {billDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hình ảnh</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tên sản phẩm</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Mã sản phẩm</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Màu sắc</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Kích thước</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Số lượng</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Giá</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Giá khuyến mãi</th>
                
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {billDetails.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-2">
                      {item.productImage && item.productImage.length > 0 ? (
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
                    </td>
                    <td className="px-4 py-2">{item.productName || 'N/A'}</td>
                    <td className="px-4 py-2">{item.productDetailCode || 'N/A'}</td>
                    <td className="px-4 py-2">{item.productColor || 'N/A'}</td>
                    <td className="px-4 py-2">{item.productSize || 'N/A'}</td>
                    <td className="px-4 py-2">{item.quantity || '0'}</td>
                    <td className="px-4 py-2">{formatMoney(item.price)}</td>
                    <td className="px-4 py-2">{formatMoney(item.promotionalPrice)}</td>
                  
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          orderStatusOptions.find((opt) => opt.value === item.typeOrder)?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {orderStatusOptions.find((opt) => opt.value === item.typeOrder)?.label || item.typeOrder || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Không có chi tiết sản phẩm</p>
        )}
      </div>
    </div>
  );
};

export default BillDetail;