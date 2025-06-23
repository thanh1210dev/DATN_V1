import React, { useState, useEffect } from "react";
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash } from "react-icons/hi";
import { BsSendDashFill } from "react-icons/bs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PromotionStatus } from "../DotGiamGiaPage/PromotionStatus";
import { useNavigate } from "react-router-dom";
import VoucherApi from "../../../Service/AdminDotGiamGiaSevice/VoucherApi";
import { VoucherType, VoucherTypeUser } from "./VoucherEnums";

const VoucherAdmin = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchName, setSearchName] = useState("");
  const [searchStartTime, setSearchStartTime] = useState("");
  const [searchEndTime, setSearchEndTime] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchTypeUser, setSearchTypeUser] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    startTime: "",
    endTime: "",
    quantity: "",
    status: "",
    fixedDiscountValue: "",
    percentageDiscountValue: "",
    maxDiscountValue: "",
    minOrderValue: "",
    createdByUserId: localStorage.getItem("id") || "",
    typeUser: VoucherTypeUser.PUBLIC,
  });
  const [formErrors, setFormErrors] = useState({});

  const statusLabels = {
    COMING_SOON: <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Sắp ra mắt</span>,
    ACTIVE: <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Đang hoạt động</span>,
    EXPIRED: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Hết hạn</span>,
    USED_UP: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Hết lượt</span>,
    INACTIVE: <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Không hoạt động</span>,
  };

  const typeLabels = {
    FIXED: "Giảm cố định",
    PERCENTAGE: "Giảm phần trăm",
  };

  const typeUserLabels = {
    PUBLIC: "Công khai",
    PRIVATE: "Riêng tư",
  };

  const currentDate = new Date().toISOString().slice(0, 16);
  const MAX_NUMERIC_VALUE = 99999999.99;

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [page, size, searchName, searchStartTime, searchEndTime, searchStatus, searchTypeUser]);

  const fetchData = async () => {
    try {
      const params = {
        name: searchName || undefined,
        startTime: searchStartTime ? new Date(searchStartTime).toISOString() : undefined,
        endTime: searchEndTime ? new Date(searchEndTime).toISOString() : undefined,
        status: searchStatus || undefined,
        typeUser: searchTypeUser || undefined,
        page,
        size,
      };
      const response = await VoucherApi.searchVouchers(params);
      setData(response.data.content || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi tải dữ liệu", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchData();
  };

  const handleAdd = () => {
    setSelectedVoucher(null);
    setFormData({
      name: "",
      type: "",
      startTime: currentDate,
      endTime: currentDate,
      status: "ACTIVE",
      quantity: "",
      fixedDiscountValue: "",
      percentageDiscountValue: "",
      maxDiscountValue: "",
      minOrderValue: "",
      createdByUserId: localStorage.getItem("id") || "",
      typeUser: VoucherTypeUser.PUBLIC,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/chi-tiet-voucher/${id}`);
  };

  const handleUpdate = (voucher) => {
    setSelectedVoucher(voucher);
    const isValidDate = (date) => date && !isNaN(new Date(date).getTime());
    setFormData({
      name: voucher.name || "",
      type: voucher.type || "",
      startTime: isValidDate(voucher.startTime)
        ? new Date(voucher.startTime).toISOString().slice(0, 16)
        : currentDate,
      endTime: isValidDate(voucher.endTime)
        ? new Date(voucher.endTime).toISOString().slice(0, 16)
        : currentDate,
      quantity: voucher.quantity?.toString() || "",
      status: voucher.status || "ACTIVE",
      fixedDiscountValue: voucher.fixedDiscountValue?.toString() || "",
      percentageDiscountValue: voucher.percentageDiscountValue?.toString() || "",
      maxDiscountValue: voucher.maxDiscountValue?.toString() || "",
      minOrderValue: voucher.minOrderValue?.toString() || "",
      createdByUserId: localStorage.getItem("id") || "",
      typeUser: voucher.typeUser || VoucherTypeUser.PUBLIC,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await VoucherApi.deleteVoucher(deleteId);
      toast.success("Xóa voucher thành công!", { position: "top-right", autoClose: 3000 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi xóa", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name) errors.name = "Tên voucher là bắt buộc";
    if (!formData.type) errors.type = "Loại giảm giá là bắt buộc";
    if (!formData.typeUser) errors.typeUser = "Loại người dùng là bắt buộc";
    if (selectedVoucher && !formData.status) errors.status = "Trạng thái là bắt buộc";
    if (!formData.startTime) errors.startTime = "Thời gian bắt đầu là bắt buộc";
    if (!formData.endTime) errors.endTime = "Thời gian kết thúc là bắt buộc";
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      errors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }

    const minOrder = parseFloat(formData.minOrderValue);
    if (isNaN(minOrder) || minOrder <= 0) {
      errors.minOrderValue = "Giá trị đơn hàng tối thiểu phải lớn hơn 0";
    }

    if (formData.type === VoucherType.FIXED) {
      const fixed = parseFloat(formData.fixedDiscountValue);
      if (isNaN(fixed) || fixed <= 0) {
        errors.fixedDiscountValue = "Giá trị giảm cố định phải lớn hơn 0";
      } else if (fixed > MAX_NUMERIC_VALUE) {
        errors.fixedDiscountValue = "Giá trị giảm cố định quá lớn";
      } else if (fixed && minOrder && fixed > minOrder) {
        errors.minOrderValue = "Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng giá trị giảm cố định";
      }
      if (formData.percentageDiscountValue) {
        errors.percentageDiscountValue = "Không sử dụng phần trăm giảm giá cho loại FIXED";
      }
      if (formData.maxDiscountValue) {
        errors.maxDiscountValue = "Không sử dụng giá trị giảm tối đa cho loại FIXED";
      }
    } else if (formData.type === VoucherType.PERCENTAGE) {
      const percentage = parseFloat(formData.percentageDiscountValue);
      if (isNaN(percentage) || percentage <= 0) {
        errors.percentageDiscountValue = "Phần trăm giảm giá phải lớn hơn 0";
      } else if (percentage > 100) {
        errors.percentageDiscountValue = "Phần trăm giảm giá không được vượt quá 100";
      } else if (percentage > MAX_NUMERIC_VALUE) {
        errors.percentageDiscountValue = "Phần trăm giảm giá quá lớn";
      }
      const maxDiscount = parseFloat(formData.maxDiscountValue);
      if (isNaN(maxDiscount) || maxDiscount <= 0) {
        errors.maxDiscountValue = "Giá trị giảm tối đa phải lớn hơn 0";
      } else if (maxDiscount > MAX_NUMERIC_VALUE) {
        errors.maxDiscountValue = "Giá trị giảm tối đa quá lớn";
      }
      if (formData.fixedDiscountValue) {
        errors.fixedDiscountValue = "Không sử dụng giá trị giảm cố định cho loại PERCENTAGE";
      }
    }

    const quantity = parseInt(formData.quantity);
    if (formData.quantity && (isNaN(quantity) || quantity < 0)) {
      errors.quantity = "Số lượng phải không âm";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra các trường dữ liệu", { position: "top-right", autoClose: 5000 });
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      quantity: formData.quantity ? parseInt(formData.quantity) : null,
      status: selectedVoucher ? formData.status : "ACTIVE",
      fixedDiscountValue: formData.fixedDiscountValue ? Number(parseFloat(formData.fixedDiscountValue).toFixed(2)) : null,
      percentageDiscountValue: formData.percentageDiscountValue ? Number(parseFloat(formData.percentageDiscountValue).toFixed(2)) : null,
      maxDiscountValue: formData.maxDiscountValue ? Number(parseFloat(formData.maxDiscountValue).toFixed(2)) : null,
      minOrderValue: formData.minOrderValue ? Number(parseFloat(formData.minOrderValue).toFixed(2)) : null,
      createdByUserId: formData.createdByUserId ? parseInt(formData.createdByUserId) : null,
      typeUser: formData.typeUser,
    };

    setPendingPayload(payload);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      if (selectedVoucher) {
        await VoucherApi.updateVoucher(selectedVoucher.id, pendingPayload);
        toast.success("Cập nhật voucher thành công!", { position: "top-right", autoClose: 3000 });
      } else {
        await VoucherApi.createVoucher(pendingPayload);
        toast.success("Thêm voucher thành công!", { position: "top-right", autoClose: 3000 });
      }
      setIsFormOpen(false);
      setIsConfirmModalOpen(false);
      setPendingPayload(null);
      fetchData();
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi khi lưu voucher";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join("; ");
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 5000 });
      setIsConfirmModalOpen(false);
      setPendingPayload(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value };
      if (name === "type") {
        if (value === VoucherType.FIXED) {
          updatedFormData.percentageDiscountValue = "";
          updatedFormData.maxDiscountValue = "";
        } else if (value === VoucherType.PERCENTAGE) {
          updatedFormData.fixedDiscountValue = "";
        }
      }
      return updatedFormData;
    });
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      {/* Search and Filter */}
      <div className="flex justify-between items-center mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Tìm kiếm bằng tên..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            <HiOutlineSearch className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>
          <input
            type="datetime-local"
            value={searchStartTime}
            onChange={(e) => setSearchStartTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <input
            type="datetime-local"
            value={searchEndTime}
            onChange={(e) => setSearchEndTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.values(PromotionStatus).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status].props.children}
              </option>
            ))}
          </select>
          <select
            value={searchTypeUser}
            onChange={(e) => setSearchTypeUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">Tất cả loại người dùng</option>
            {Object.values(VoucherTypeUser).map((typeUser) => (
              <option key={typeUser} value={typeUser}>
                {typeUserLabels[typeUser]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            Tìm kiếm
          </button>
        </form>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          <HiOutlinePlus className="mr-2" size={18} />
          Thêm mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-xs text-left text-gray-700">
          <thead className="text-xs font-medium uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-2 py-2 rounded-tl-lg">#</th>
              <th className="px-2 py-2">Mã</th>
              <th className="px-2 py-2">Tên</th>
              <th className="px-2 py-2">Loại</th>
              <th className="px-2 py-2">Loại người dùng</th>
              <th className="px-2 py-2">Thời gian bắt đầu</th>
              <th className="px-2 py-2">Thời gian kết thúc</th>
              <th className="px-2 py-2">Số lượng</th>
              <th className="px-2 py-2">Giá trị giảm</th>
              <th className="px-2 py-2">Giá trị tối đa</th>
              <th className="px-2 py-2">Đơn tối thiểu</th>
              <th className="px-2 py-2">Trạng thái</th>
              <th className="px-2 py-2 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="13" className="px-2 py-4 text-center text-gray-500 text-xs">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-indigo-50 transition-colors">
                  <td className="px-2 py-2 text-center">{page * size + index + 1}</td>
                  <td className="px-2 py-2">{item.code}</td>
                  <td className="px-2 py-2">{item.name}</td>
                  <td className="px-2 py-2">{typeLabels[item.type] || item.type}</td>
                  <td className="px-2 py-2">{typeUserLabels[item.typeUser] || item.typeUser}</td>
                  <td className="px-2 py-2">{new Date(item.startTime).toLocaleString()}</td>
                  <td className="px-2 py-2">{new Date(item.endTime).toLocaleString()}</td>
                  <td className="px-2 py-2">{item.quantity || "-"}</td>
                  <td className="px-2 py-2">
                    {item.type === VoucherType.PERCENTAGE && item.percentageDiscountValue
                      ? `${item.percentageDiscountValue}%`
                      : item.fixedDiscountValue
                      ? `${item.fixedDiscountValue} VND`
                      : "-"}
                  </td>
                  <td className="px-2 py-2">{item.maxDiscountValue ? `${item.maxDiscountValue} VND` : "-"}</td>
                  <td className="px-2 py-2">{item.minOrderValue ? `${item.minOrderValue} VND` : "-"}</td>
                  <td className="px-2 py-2">{statusLabels[item.status]}</td>
                  <td className="px-2 py-2 text-center flex justify-center gap-1">
                    <button
                      className="p-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      onClick={() => handleViewDetail(item.id)}
                    >
                      <BsSendDashFill size={14} />
                    </button>
                    <button
                      onClick={() => handleUpdate(item)}
                      className="p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <HiOutlinePencilAlt size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page + 1 >= totalPages}
          >
            Tiếp →
          </button>
        </div>
        <select
          className="bg-white text-gray-700 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Form Modal */}
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isFormOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100">
          <h2 className="text-xl font-bold text-indigo-700 mb-6">
            {selectedVoucher ? "Cập nhật Voucher" : "Thêm mới Voucher"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên voucher</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                required
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.type ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                required
              >
                <option value="">Chọn loại</option>
                {Object.values(VoucherType).map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
              {formErrors.type && <p className="text-xs text-red-500 mt-1">{formErrors.type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại người dùng</label>
              <select
                name="typeUser"
                value={formData.typeUser}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.typeUser ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                required
              >
                <option value="">Chọn loại người dùng</option>
                {Object.values(VoucherTypeUser).map((typeUser) => (
                  <option key={typeUser} value={typeUser}>
                    {typeUserLabels[typeUser]}
                  </option>
                ))}
              </select>
              {formErrors.typeUser && <p className="text-xs text-red-500 mt-1">{formErrors.typeUser}</p>}
              {formData.typeUser === VoucherTypeUser.PRIVATE && (
                <p className="text-xs text-gray-500 mt-1">Lưu ý: Voucher riêng tư chỉ áp dụng cho người dùng được chỉ định.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === VoucherType.PERCENTAGE ? "Phần trăm giảm (%)" : "Giá trị giảm (VND)"}
              </label>
              <input
                type="number"
                name={formData.type === VoucherType.PERCENTAGE ? "percentageDiscountValue" : "fixedDiscountValue"}
                value={
                  formData.type === VoucherType.PERCENTAGE
                    ? formData.percentageDiscountValue
                    : formData.fixedDiscountValue
                }
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.fixedDiscountValue || formErrors.percentageDiscountValue ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                min="0"
                step="0.01"
                required={!!formData.type}
                disabled={!formData.type}
              />
              {(formErrors.fixedDiscountValue || formErrors.percentageDiscountValue) && (
                <p className="text-xs text-red-500 mt-1">{formErrors.fixedDiscountValue || formErrors.percentageDiscountValue}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm tối đa (VND)</label>
              <input
                type="number"
                name="maxDiscountValue"
                value={formData.maxDiscountValue}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.maxDiscountValue ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                min="0"
                step="0.01"
                required={formData.type === VoucherType.PERCENTAGE}
                disabled={formData.type !== VoucherType.PERCENTAGE}
              />
              {formErrors.maxDiscountValue && <p className="text-xs text-red-500 mt-1">{formErrors.maxDiscountValue}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị đơn hàng tối thiểu (VND)</label>
              <input
                type="number"
                name="minOrderValue"
                value={formData.minOrderValue}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.minOrderValue ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                min="0"
                step="0.01"
                required
              />
              {formErrors.minOrderValue && <p className="text-xs text-red-500 mt-1">{formErrors.minOrderValue}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.startTime ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                required
              />
              {formErrors.startTime && <p className="text-xs text-red-500 mt-1">{formErrors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.endTime ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                required
              />
              {formErrors.endTime && <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.quantity ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                min="0"
              />
              {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
            </div>
            {selectedVoucher && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${formErrors.status ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                  required
                >
                  <option value="">Chọn trạng thái</option>
                  {Object.values(PromotionStatus).map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status].props.children}
                    </option>
                  ))}
                </select>
                {formErrors.status && <p className="text-xs text-red-500 mt-1">{formErrors.status}</p>}
              </div>
            )}
            <div className="col-span-2 flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isConfirmModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có muốn {selectedVoucher ? "cập nhật" : "thêm mới"} voucher này không?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsConfirmModalOpen(false);
                setPendingPayload(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isDeleteModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận xóa</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có chắc chắn muốn xóa voucher này không?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherAdmin;


