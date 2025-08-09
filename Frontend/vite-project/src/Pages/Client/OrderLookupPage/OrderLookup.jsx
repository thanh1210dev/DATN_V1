import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';
import axiosInstance from '../../../Service/axiosInstance';
// use HoaDonApi.createReturnWithFiles for multipart

const formatMoney = (amount) => {
  try {
    return Number(amount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  } catch {
    return '0 ₫';
  }
};

// Mapping trạng thái đơn hàng sang tiếng Việt
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

// Mapping trạng thái thanh toán sang tiếng Việt
const paymentStatusViMap = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn tiền một phần',
};

export default function OrderLookup() {
  const location = useLocation();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Sản phẩm lỗi/không đúng mô tả');
  const [returnItems, setReturnItems] = useState({}); // { billDetailId: qty }
  const [returnFiles, setReturnFiles] = useState([]);
  const [creatingReturn, setCreatingReturn] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code?.trim() || !phone?.trim()) {
      toast.error('Vui lòng nhập mã đơn và số điện thoại');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await HoaDonApi.lookupOrder(code.trim(), phone.trim());
      setResult(data);
      if (!data) toast.info('Không tìm thấy đơn hàng');
    } catch (err) {
      toast.error(err.message || 'Không tìm thấy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill khi điều hướng từ checkout
  useEffect(() => {
    const st = location.state || {};
    // Ưu tiên state; fallback query params (VNPay redirect)
    const params = new URLSearchParams(location.search);
    const qpCode = params.get('code');
    const qpPhone = params.get('phone');
    const prefillCode = st.code || qpCode;
    const prefillPhone = st.phone || qpPhone;
    if (prefillCode && prefillPhone) {
      setCode(prefillCode);
      setPhone(prefillPhone);
      // Tự động tra cứu
      (async () => {
        setLoading(true);
        setResult(null);
        try {
          const data = await HoaDonApi.lookupOrder(prefillCode, prefillPhone);
          setResult(data);
          if (!data) toast.info('Không tìm thấy đơn hàng');
          else if (st.justOrdered || params.get('status') === 'success') toast.success('Đặt hàng thành công!');
        } catch (err) {
          toast.error(err.message || 'Không tìm thấy đơn hàng');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tra cứu đơn hàng</h1>
          <p className="text-gray-600 mb-6">Nhập mã đơn hàng và số điện thoại để tra cứu tình trạng đơn.</p>

          <form onSubmit={handleLookup} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: DH12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: 09xxxxxxxx"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 md:h-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
          </form>

          {result && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kết quả</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center"><span className="w-40 text-gray-600">Mã đơn:</span><span className="font-medium">{result.code || 'N/A'}</span></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-40 text-gray-600">Trạng thái:</span>
                      <span className="font-medium">{statusMapping[result.status] || result.status || 'N/A'}</span>
                    </div>
                    {result.status === 'CONFIRMING' && (
                      <button
                        className="ml-4 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        disabled={cancelling}
                        onClick={async () => {
                          if (!code || !phone) return;
                          if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
                          try {
                            setCancelling(true);
                            const data = await HoaDonApi.cancelOrder(code, phone);
                            setResult(data);
                            toast.success('Đã hủy đơn hàng');
                          } catch (err) {
                            toast.error(err.message || 'Không thể hủy đơn');
                          } finally {
                            setCancelling(false);
                          }
                        }}
                      >
                        {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                      </button>
                    )}
                    {['DELIVERED','COMPLETED'].includes(result.status) && (
                      <button
                        className="ml-4 px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        onClick={() => {
                          // init default quantities to 0
                          const init = {};
                          (result.items||[]).forEach(it => { init[it.id] = 0; });
                          setReturnItems(init);
                          setShowReturnModal(true);
                        }}
                      >
                        Yêu cầu trả hàng
                      </button>
                    )}
                  </div>
                  <div className="flex items-center"><span className="w-40 text-gray-600">Ngày tạo:</span><span className="font-medium">{result.createdAt ? new Date(result.createdAt).toLocaleString('vi-VN') : 'N/A'}</span></div>
                  <div className="flex items-center"><span className="w-40 text-gray-600">Khách hàng:</span><span className="font-medium">{result.customerName || 'N/A'}</span></div>
                  <div className="flex items-center"><span className="w-40 text-gray-600">SĐT:</span><span className="font-medium">{result.phoneNumber || 'N/A'}</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center"><span className="w-40 text-gray-600">Tổng tiền:</span><span className="font-medium">{formatMoney(result.totalMoney)}</span></div>
                  <div className="flex items-center"><span className="w-40 text-gray-600">Phí ship:</span><span className="font-medium">{formatMoney(result.moneyShip)}</span></div>
                  <div className="flex items-center"><span className="w-40 text-gray-600">Giảm giá:</span><span className="font-medium">{formatMoney(result.reductionAmount)}</span></div>
                  <div className="flex items-center"><span className="w-40 text-gray-600">Cần thanh toán:</span><span className="font-medium text-red-600">{formatMoney(result.finalAmount)}</span></div>
                  {result.paymentStatus && (
                    <div className="flex items-center"><span className="w-40 text-gray-600">Thanh toán:</span><span className="font-medium">{paymentStatusViMap[result.paymentStatus] || result.paymentStatus}</span></div>
                  )}
                </div>
              </div>

              {Array.isArray(result.items) && result.items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Sản phẩm</h3>
                  
                  {/* Desktop view - Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-2">Ảnh</th>
                          <th className="px-4 py-2">Sản phẩm</th>
                          <th className="px-4 py-2">Mã SP</th>
                          <th className="px-4 py-2">Size</th>
                          <th className="px-4 py-2">Màu</th>
                          <th className="px-4 py-2 text-right">SL</th>
                          <th className="px-4 py-2 text-right">Giá</th>
                          <th className="px-4 py-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.filter(it => it.status !== 'RETURNED').map((it) => (
                          <tr key={it.id} className="bg-white border-b">
                            <td className="px-4 py-2">
                              <img
                                src={
                                  it.productImage && it.productImage.length > 0
                                    ? `http://localhost:8080${it.productImage[0].url}`
                                    : '/no-image.jpg'
                                }
                                alt={it.productName || 'Sản phẩm'}
                                className="w-12 h-12 object-cover rounded-md"
                                onError={(e) => {
                                  e.target.src = '/no-image.jpg';
                                }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="font-medium">{it.productName || 'N/A'}</div>
                            </td>
                            <td className="px-4 py-2">{it.productDetailCode || 'N/A'}</td>
                            <td className="px-4 py-2">{it.productSize || 'N/A'}</td>
                            <td className="px-4 py-2">{it.productColor || 'N/A'}</td>
                            <td className="px-4 py-2 text-right">{it.quantity || 0}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(it.promotionalPrice ?? it.price)}</td>
                            <td className="px-4 py-2 text-right">{formatMoney((it.promotionalPrice ?? it.price) * (it.quantity || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view - Cards */}
                  <div className="md:hidden space-y-4">
                    {result.items.filter(it => it.status !== 'RETURNED').map((it) => (
                      <div key={it.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              it.productImage && it.productImage.length > 0
                                ? `http://localhost:8080${it.productImage[0].url}`
                                : '/no-image.jpg'
                            }
                            alt={it.productName || 'Sản phẩm'}
                            className="w-16 h-16 object-cover rounded-md"
                            onError={(e) => {
                              e.target.src = '/no-image.jpg';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{it.productName || 'N/A'}</h4>
                            <p className="text-sm text-gray-500 mb-2">Mã: {it.productDetailCode || 'N/A'}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-gray-500">Size:</span> {it.productSize || 'N/A'}</div>
                              <div><span className="text-gray-500">Màu:</span> {it.productColor || 'N/A'}</div>
                              <div><span className="text-gray-500">SL:</span> {it.quantity || 0}</div>
                              <div><span className="text-gray-500">Giá:</span> <span className="font-medium">{formatMoney(it.promotionalPrice ?? it.price)}</span></div>
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-right">
                                <span className="text-sm text-gray-500">Thành tiền: </span>
                                <span className="font-bold text-indigo-600">{formatMoney((it.promotionalPrice ?? it.price) * (it.quantity || 0))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                          {(result.items||[]).filter(it => it.status !== 'RETURNED').map(it => {
                            const maxQty = it.quantity || 0;
                            return (
                              <div key={it.id} className="flex items-center justify-between gap-3 border rounded p-2">
                                <div className="flex items-center gap-3">
                                  <img src={it.productImage?.[0]?.url ? `http://localhost:8080${it.productImage[0].url}` : '/no-image.jpg'}
                                       className="w-10 h-10 object-cover rounded" />
                                  <div>
                                    <div className="text-sm font-medium">{it.productName}</div>
                                    <div className="text-xs text-gray-500">SL mua: {maxQty}</div>
                                  </div>
                                </div>
                                <input type="number" min={0} max={maxQty}
                                       value={returnItems[it.id] ?? 0}
                                       onChange={e => setReturnItems(prev=>({...prev, [it.id]: Math.max(0, Math.min(maxQty, Number(e.target.value)||0))}))}
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
                                  // validate at least one qty > 0
                                  const payloadItems = Object.entries(returnItems)
                                    .filter(([,qty])=> (qty||0) > 0)
                                    .map(([billDetailId,qty])=>({ billDetailId: Number(billDetailId), quantity: Number(qty) }));
                                  if (payloadItems.length === 0) { toast.error('Vui lòng chọn sản phẩm và số lượng cần trả'); return; }
                                  setCreatingReturn(true);
                                  const payload = { reason: returnReason, fullReturn: false, items: payloadItems };
                                  await HoaDonApi.createReturnWithFiles(result.id, payload, returnFiles);
                                  toast.success('Đã gửi yêu cầu trả hàng');
                                  setShowReturnModal(false);
                                  // Refresh order info
                                  const refreshed = await HoaDonApi.lookupOrder(code, phone);
                                  setResult(refreshed);
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
          )}
        </div>
      </div>
    </div>
  );
}
