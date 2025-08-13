import React, { useState, useEffect } from 'react';
import { HiOutlineEye, HiOutlinePlus, HiOutlinePrinter, HiOutlineDownload } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import HoaDonApi from '../../../Service/AdminHoaDonService/HoaDonApi';

const BillAdmin = () => {
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({});
  const [filters, setFilters] = useState({
    code: '',
    status: '',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
  });
  const navigate = useNavigate();

  // Vietnamese labels and colors for OrderStatus, BillType, and PaymentType
  const orderStatusOptions = [
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

  // Fetch bills with filters
  const fetchBills = async () => {
    try {
      const formattedFilters = {
        ...filters,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00Z` : null,
        endDate: filters.endDate ? `${filters.endDate}T00:00:00Z` : null,
        phoneNumber: filters.phoneNumber || null,
      };
      const data = await HoaDonApi.searchBillsAdvanced({
        ...formattedFilters,
        page,
        size,
      });
      setBills(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi tải danh sách hóa đơn');
    }
  };

  // Fetch total counts for each status
  const fetchStatusCounts = async () => {
    const counts = {};
    for (const option of orderStatusOptions) {
      const total = await HoaDonApi.getTotalBillsByStatus(option.value);
      counts[option.value] = total;
    }
    setStatusCounts(counts);
  };

  // Handle print invoice
  const handlePrintInvoice = async (billId) => {
    try {
      const base64PDF = await HoaDonApi.printInvoice(billId);
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
      link.download = `invoice_${billId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải hóa đơn thành công');
    } catch (error) {
      toast.error(error.message || 'Lỗi khi in hóa đơn');
    }
  };

  // Handle export to Excel
  const handleExportExcel = () => {
    try {
      // Prepare data for Excel
      const data = bills.map((bill, index) => ({
        STT: page * size + index + 1,
        'Mã hóa đơn': bill.code || 'N/A',
        'Khách hàng': bill.customerName || 'Khách lẻ',
        'SĐT': bill.phoneNumber || 'N/A',
        'Loại hóa đơn': billTypeOptions.find((opt) => opt.value === bill.billType)?.label || bill.billType || 'N/A',
        'Phương thức TT': paymentTypeOptions.find((opt) => opt.value === bill.type)?.label || bill.type || 'N/A',
        'Tổng tiền': bill.finalAmount ? bill.finalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0 ₫',
        'Ngày tạo': bill.createdAt ? new Date(bill.createdAt).toLocaleString('vi-VN') : 'N/A',
        'Trạng thái': orderStatusOptions.find((opt) => opt.value === bill.status)?.label || bill.status || 'N/A',
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths (approximate pixel values converted to Excel units)
      ws['!cols'] = [
        { wpx: 50 },  // STT
        { wpx: 120 }, // Mã hóa đơn
        { wpx: 150 }, // Khách hàng
        { wpx: 100 }, // SĐT
        { wpx: 100 }, // Loại hóa đơn
        { wpx: 100 }, // Phương thức TT
        { wpx: 120 }, // Tổng tiền
        { wpx: 150 }, // Ngày tạo
        { wpx: 120 }, // Trạng thái
      ];

      // Create workbook and append worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bills');

      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `bills_export_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
      toast.success('Đã xuất Excel thành công');
    } catch (error) {
      toast.error('Lỗi khi xuất Excel: ' + error.message);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchStatusCounts();
  }, [page, size, filters]);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0); // Reset to first page on filter change
  };

  // Handle status tab click
  const handleStatusTabClick = (status) => {
    setFilters((prev) => ({ ...prev, status }));
    setPage(0); // Reset to first page
  };

  // Handle filter form submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchBills();
  };

  // Navigate to bill details
  const handleViewDetails = (billId) => {
    navigate(`/admin/bills/${billId}`);
  };

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Quản lý hóa đơn</h2>
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center gap-2"
        >
          <HiOutlineDownload size={16} />
          Xuất Excel
        </button>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã hóa đơn</label>
            <input
              type="text"
              name="code"
              value={filters.code}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập mã hóa đơn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              name="phoneNumber"
              value={filters.phoneNumber}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá tối thiểu</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập giá tối thiểu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá tối đa</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập giá tối đa"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            Lọc
          </button>
        </div>
      </form>

      {/* Status Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {orderStatusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStatusTabClick(option.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.status === option.value
                ? `${option.color} border border-gray-300`
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <div className="text-purple-700">
              {option.label} ({statusCounts[option.value] || 0})
            </div>
          </button>
        ))}
      </div>

      {/* Bills Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
              <th className="px-6 py-3 w-32">Mã hóa đơn</th>
              <th className="px-6 py-3">Khách hàng</th>
              <th className="px-6 py-3">SĐT</th>
              <th className="px-6 py-3">Loại hóa đơn</th>
              <th className="px-6 py-3">Thanh toán</th>
              <th className="px-6 py-3">Tổng tiền</th>
              <th className="px-6 py-3">Ngày tạo</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3 w-48 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-4 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              bills.map((bill, index) => {
                const canPrint = bill.status === 'COMPLETED';
                return (
                <tr key={bill.id} className="border-b hover:bg-indigo-50 transition-colors">
                  <td className="px-6 py-3 text-center">{page * size + index + 1}</td>
                  <td className="px-6 py-3">{bill.code}</td>
                  <td className="px-6 py-3">{bill.customerName || 'Khách lẻ'}</td>
                  <td className="px-6 py-3">{bill.phoneNumber || 'Không có'}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        billTypeOptions.find((opt) => opt.value === bill.billType)?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
          {billTypeOptions.find((opt) => opt.value === bill.billType)?.label || bill.billType || 'Không có'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        paymentTypeOptions.find((opt) => opt.value === bill.type)?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
          {paymentTypeOptions.find((opt) => opt.value === bill.type)?.label || bill.type || 'Không có'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-red-800 font-semibold">
                    {bill.finalAmount ? bill.finalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0 ₫'}
                  </td>
        <td className="px-6 py-3">{bill.createdAt ? new Date(bill.createdAt).toLocaleString('vi-VN') : 'Không có'}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        orderStatusOptions.find((opt) => opt.value === bill.status)?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
          {orderStatusOptions.find((opt) => opt.value === bill.status)?.label || bill.status || 'Không có'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center flex gap-2">
                    <button
                      onClick={() => handleViewDetails(bill.id)}
                      className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      title="Xem chi tiết"
                    >
                      <HiOutlineEye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (canPrint) {
                          handlePrintInvoice(bill.id);
                        } else {
                          toast.warn('Chỉ in hóa đơn khi đơn ở trạng thái Hoàn thành');
                        }
                      }}
                      disabled={!canPrint}
                      className={`p-1.5 rounded-md focus:outline-none focus:ring-2 transition-colors ${canPrint ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-300'}`}
                      title={canPrint ? 'In hóa đơn' : 'Chỉ có thể in khi trạng thái Hoàn thành'}
                    >
                      <HiOutlinePrinter size={16} />
                    </button>
                  </td>
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page + 1 >= totalPages}
          >
            Tiếp →
          </button>
        </div>
        <select
          className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={size}
          onChange={(e) => {
            setSize(parseInt(e.target.value));
            setPage(0);
          }}
        >
          <option value={5}>5 / trang</option>
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
      </div>
    </div>
  );
};

export default BillAdmin;