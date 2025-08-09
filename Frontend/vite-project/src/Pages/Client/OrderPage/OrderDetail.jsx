import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OrderStatus from './OrderStatus';
import axiosInstance from '../../../Service/axiosInstance';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Sản phẩm lỗi/không đúng mô tả');
  const [returnItems, setReturnItems] = useState({});
  const [returnFiles, setReturnFiles] = useState([]);
  const [creatingReturn, setCreatingReturn] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Gọi trực tiếp API lấy bill theo id
        const response = await axiosInstance.get(`/cart-checkout/bill/${id}`);
        setOrder(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không tìm thấy đơn hàng', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openReturnFlow = () => {
    const init = {};
    (order.items || []).forEach(it => { if (it?.id != null) init[it.id] = 0; });
    setReturnItems(init);
    setShowReturnModal(true);
    setShowActions(false);
  };

  if (!order) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 text-lg">Đang tải...</div>;
  }

  const fulfillmentViMap = {
    PENDING: 'Chờ xử lý',
    CONFIRMING: 'Đang xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKED: 'Đã đóng gói',
    DELIVERING: 'Đang giao hàng',
    DELIVERED: 'Đã giao hàng',
    DELIVERY_FAILED: 'Giao thất bại',
    RETURN_REQUESTED: 'Yêu cầu trả hàng',
    RETURNED: 'Đã trả hàng',
  RETURN_COMPLETED: 'Hoàn tất trả hàng',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành'
  };

  // Mapping trạng thái thanh toán sang tiếng Việt (hiển thị badge "Thanh toán:")
  const paymentStatusViMap = {
    UNPAID: 'Chưa thanh toán',
    PENDING: 'Đang chờ thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
    PARTIALLY_REFUNDED: 'Đã hoàn tiền một phần',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chi Tiết Đơn Hàng #{order.code}</h1>
          {/* Actions dropdown */}
          <div className="relative" ref={actionsRef}>
            <button
              className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
              onClick={()=>setShowActions(v=>!v)}
            >
              Thao tác ▾
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <ul className="py-1 text-sm text-gray-700">
                  {['DELIVERED','COMPLETED'].includes(order.status) ? (
                    <li>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={openReturnFlow}
                      >
                        Yêu cầu trả hàng
                      </button>
                    </li>
                  ) : (
                    <li>
                      <button className="w-full text-left px-4 py-2 text-gray-400 cursor-not-allowed" disabled>
                        Yêu cầu trả hàng (không khả dụng)
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <OrderStatus status={order.status} />
        <div className="flex flex-wrap gap-2 mb-6 text-xs">
          {order.paymentStatus && (
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200 uppercase">
              Thanh toán: {paymentStatusViMap[order.paymentStatus] || order.paymentStatus}
            </span>
          )}
          {order.fulfillmentStatus && (
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
              Giao hàng: {fulfillmentViMap[order.fulfillmentStatus] || order.fulfillmentStatus}
            </span>
          )}
        </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Giao Hàng</h2>
            <p className="text-sm text-gray-600">Tên: {order.customerName}</p>
            <p className="text-sm text-gray-600">
              Địa chỉ: {order.address}, {order.wardName}, {order.districtName}, {order.provinceName}
            </p>
            <p className="text-sm text-gray-600">Số điện thoại: {order.phoneNumber}</p>
            <p className="text-sm text-gray-600">Phương thức thanh toán: {order.paymentType || order.type}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sản Phẩm</h2>
            {order.items && order.items.length > 0 ? order.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b py-3 text-sm text-gray-600">
                <span>
                  {item.productName} ({item.productColor}, {item.productSize}) x {item.quantity}
                  <br />
                  <span className="text-xs">Trọng lượng: {(item.weight || 500) * item.quantity}g</span>
                </span>
                <span>{(item.price * item.quantity).toLocaleString('vi-VN')} VND</span>
              </div>
            )) : <p className="text-sm text-gray-500">Không có sản phẩm</p>}
            <div className="flex justify-between text-sm text-gray-600 mt-4">
              <span>Tạm tính:</span>
              <span>{order.totalMoney.toLocaleString('vi-VN')} VND</span>
            </div>
            {order.reductionAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 mt-2">
                <span>Giảm giá (Voucher):</span>
                <span>-{order.reductionAmount.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Phí vận chuyển:</span>
              <span>{(order.moneyShip || 0).toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900 mt-2">
              <span>Tổng cộng:</span>
              <span>{order.finalAmount.toLocaleString('vi-VN')} VND</span>
            </div>

            {/* Return action moved to dropdown above */}
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Tạo yêu cầu trả hàng</h3>
            <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                <textarea className="w-full border rounded px-3 py-2 text-sm" rows={3}
                          value={returnReason} onChange={e=>setReturnReason(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm và số lượng trả</label>
                <div className="space-y-2">
                  {(order.items||[]).map(it => {
                    const maxQty = it.quantity || 0;
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-3 border rounded p-2">
                        <div className="flex items-center gap-3">
                          <img src={(it.productImage && it.productImage[0]?.url) ? `http://localhost:8080${it.productImage[0].url}` : 'https://via.placeholder.com/40'}
                               className="w-10 h-10 object-cover rounded" />
                          <div>
                            <div className="text-sm font-medium">{it.productName || 'Sản phẩm'}</div>
                            <div className="text-xs text-gray-500">SL mua: {maxQty}</div>
                          </div>
                        </div>
                        <input type="number" min={0} max={maxQty}
                               value={returnItems[it.id] ?? 0}
                               onChange={e => setReturnItems(prev=>({
                                 ...prev,
                                 [it.id]: Math.max(0, Math.min(maxQty, Number(e.target.value)||0))
                               }))}
                               className="w-24 border rounded px-2 py-1 text-sm text-right" />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh/Video minh chứng</label>
                <input type="file" accept="image/*,video/*" multiple onChange={(e)=>setReturnFiles(Array.from(e.target.files||[]))} />
                <p className="text-xs text-gray-500 mt-1">Tối đa ~15MB mỗi file (theo cấu hình backend).</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm border rounded" onClick={()=>setShowReturnModal(false)}>Hủy</button>
              <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded disabled:opacity-50" disabled={creatingReturn}
                      onClick={async ()=>{
                        try {
                          const payloadItems = Object.entries(returnItems)
                            .filter(([,qty])=> (qty||0) > 0)
                            .map(([billDetailId,qty])=>({ billDetailId: Number(billDetailId), quantity: Number(qty) }));
                          if (payloadItems.length === 0) { toast.error('Vui lòng chọn sản phẩm và số lượng cần trả'); return; }
                          setCreatingReturn(true);
                          const payload = { reason: returnReason, fullReturn: false, items: payloadItems };
                          await HoaDonApi.createReturnWithFiles(id, payload, returnFiles);
                          toast.success('Đã gửi yêu cầu trả hàng');
                          setShowReturnModal(false);
                          // refresh
                          const response = await axiosInstance.get(`/cart-checkout/bill/${id}`);
                          setOrder(response.data);
                        } catch (err) {
                          toast.error(err.message || 'Không gửi được yêu cầu trả');
                        } finally {
                          setCreatingReturn(false);
                        }
                      }}> {creatingReturn ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;