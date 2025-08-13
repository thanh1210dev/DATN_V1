import React, { useState, useEffect, useCallback } from "react";
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineTrash,
} from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DotGiamGiaApi from "../../../Service/AdminDotGiamGiaSevice/DotGiamGiaApi";
import { PromotionStatus, DiscountType } from "./PromotionStatus";
import { MONEY_MAX, MONEY_MAX_LABEL } from "../../../utils/validationConstants"; // (MONEY_MAX not directly used yet, reserved for future monetary fields)
import { useNavigate } from "react-router-dom";
import { BsSendDashFill } from "react-icons/bs";

const DotGiamGiaAdmin = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchStartTime, setSearchStartTime] = useState("");
  const [searchEndTime, setSearchEndTime] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    typePromotion: DiscountType.PERCENTAGE,
    startTime: "",
    endTime: "",
    percentageDiscountValue: "",
    description: "",
    status: PromotionStatus.COMING_SOON,
  });
  const [formErrors, setFormErrors] = useState({});

  const idUser = localStorage.getItem("id");

  const statusLabels = {
    COMING_SOON: <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Sắp ra mắt</span>,
    ACTIVE: <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Đang hoạt động</span>,
    EXPIRED: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Hết hạn</span>,
    USED_UP: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Hết lượt</span>,
    INACTIVE: <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Không hoạt động</span>,
  };

  const discountTypeLabels = {
    PERCENTAGE: "Giảm theo phần trăm",
  };

  const navigate = useNavigate();
  const currentDate = new Date().toISOString().slice(0, 16);
  // Legacy MAX_NUMERIC_VALUE removed; percentage capped at 100 by business rule.

  const fetchData = useCallback(async () => {
    try {
      const params = {
        startTime: searchStartTime ? new Date(searchStartTime).toISOString() : undefined,
        endTime: searchEndTime ? new Date(searchEndTime).toISOString() : undefined,
        status: searchStatus || undefined,
        page,
        size,
      };
      const response = await DotGiamGiaApi.search(params);
      const content = response.data.content;
      if (content.some(item => !item.id)) {
        console.warn("Một số khuyến mãi không có id:", content);
        toast.warn("Dữ liệu khuyến mãi không hợp lệ, vui lòng kiểm tra backend", {
          position: "top-right",
          autoClose: 5000,
        });
      }
      setData(content.filter(item => !item.deleted));
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi tải dữ liệu", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }, [page, size, searchStartTime, searchEndTime, searchStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchData();
  };

  const handleAdd = () => {
    setSelectedPromotion(null);
    setFormData({
      name: "",
      typePromotion: DiscountType.PERCENTAGE,
      startTime: currentDate,
      endTime: currentDate,
      percentageDiscountValue: "",
      description: "",
      status: PromotionStatus.COMING_SOON,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleViewDetail = (id) => {
    navigate(`/admin/chi-tiet-dot-giam-gia/${id}`);
  };

  const handleUpdate = (promotion) => {
    if (!promotion.id) {
      toast.error("Không thể cập nhật: ID khuyến mãi không hợp lệ", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    setSelectedPromotion(promotion);
    setFormData({
      name: promotion.name,
      typePromotion: promotion.typePromotion,
      startTime: promotion.startTime ? new Date(promotion.startTime).toISOString().slice(0, 16) : currentDate,
      endTime: promotion.endTime ? new Date(promotion.endTime).toISOString().slice(0, 16) : currentDate,
      percentageDiscountValue: promotion.percentageDiscountValue ? promotion.percentageDiscountValue.toString() : "",
      description: promotion.description || "",
      status: promotion.status,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    if (!id) {
      toast.error("Không thể xóa: ID không hợp lệ", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await DotGiamGiaApi.softDelete(deleteId);
      toast.success("Xóa thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
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

    if (!formData.name) errors.name = "Tên khuyến mãi là bắt buộc";
    else if (formData.name.length > 100) errors.name = "Tên khuyến mãi không được vượt quá 100 ký tự";

    if (!formData.typePromotion) errors.typePromotion = "Loại giảm giá là bắt buộc";
    if (selectedPromotion && !formData.status) errors.status = "Trạng thái là bắt buộc";
    if (!formData.startTime) errors.startTime = "Thời gian bắt đầu là bắt buộc";
    if (!formData.endTime) errors.endTime = "Thời gian kết thúc là bắt buộc";
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      errors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }

    const percentage = parseFloat(formData.percentageDiscountValue);
    if (isNaN(percentage) || percentage < 0) {
      errors.percentageDiscountValue = "Phần trăm giảm giá phải ít nhất là 0";
    } else if (percentage > 100) {
      errors.percentageDiscountValue = "Phần trăm giảm giá không được vượt quá 100";
  }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra các trường dữ liệu", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    const payload = {
      name: formData.name,
      typePromotion: formData.typePromotion,
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
      percentageDiscountValue: formData.percentageDiscountValue ? Number(parseFloat(formData.percentageDiscountValue).toFixed(2)) : null,
      description: formData.description || null,
      createdByUserId: idUser ? parseInt(idUser) : null,
    };

    if (selectedPromotion) {
      payload.status = formData.status;
    }

    setPendingPayload(payload);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      if (selectedPromotion) {
        if (!selectedPromotion.id) {
          throw new Error("ID khuyến mãi không hợp lệ");
        }
        await DotGiamGiaApi.update(selectedPromotion.id, pendingPayload);
        toast.success("Cập nhật thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        await DotGiamGiaApi.create(pendingPayload);
        toast.success("Thêm mới thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
      setIsFormOpen(false);
      setIsConfirmModalOpen(false);
      setPendingPayload(null);
      fetchData();
    } catch (error) {
      let errorMessage = error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lưu";
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join("; ");
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
      setIsConfirmModalOpen(false);
      setPendingPayload(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <ToastContainer />
      {/* Search and Filter */}
      <div className="flex justify-between items-center mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={searchStartTime}
            onChange={(e) => setSearchStartTime(e.target.value)}
            className="px-2 py-1.5 border border-indigo-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="datetime-local"
            value={searchEndTime}
            onChange={(e) => setSearchEndTime(e.target.value)}
            className="px-2 py-1.5 border border-indigo-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
            className="px-2 py-1.5 border border-indigo-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.values(PromotionStatus).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status].props.children}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Tìm kiếm
          </button>
        </form>
        <button
          onClick={handleAdd}
          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <HiOutlinePlus className="mr-1" size={16} />
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
              <th className="px-2 py-2">Thời gian bắt đầu</th>
              <th className="px-2 py-2">Thời gian kết thúc</th>
              <th className="px-2 py-2">Giảm %</th>
              <th className="px-2 py-2">Trạng thái</th>
              <th className="px-2 py-2 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-2 py-4 text-center text-gray-500 text-xs">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-indigo-50 transition-colors"
                >
                  <td className="px-2 py-2 text-center">{page * size + index + 1}</td>
                  <td className="px-2 py-2">{item.code}</td>
                  <td className="px-2 py-2">{item.name}</td>
                  
                  <td className="px-2 py-2">{discountTypeLabels[item.typePromotion] || item.typePromotion}</td>
                  <td className="px-2 py-2">{new Date(item.startTime).toLocaleString("vi-VN")}</td>
                  <td className="px-2 py-2">{new Date(item.endTime).toLocaleString("vi-VN")}</td>
                  <td className="px-2 py-2">{item.percentageDiscountValue ? `${item.percentageDiscountValue}%` : "-"}</td>
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
            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
        </select>
      </div>

      {/* Form Modal */}
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isFormOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-lg transform transition-all duration-300">
          <h2 className="text-lg font-semibold text-indigo-700 mb-3">
            {selectedPromotion ? "Cập nhật" : "Thêm mới"} Đợt Giảm Giá
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.name ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
                required
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Loại giảm giá</label>
              <select
                name="typePromotion"
                value={formData.typePromotion}
                onChange={handleInputChange}
                className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.typePromotion ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
                required
              >
                <option value="">Chọn loại giảm giá</option>
                <option value={DiscountType.PERCENTAGE}>{discountTypeLabels[DiscountType.PERCENTAGE]}</option>
              </select>
              {formErrors.typePromotion && <p className="text-xs text-red-500 mt-1">{formErrors.typePromotion}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Phần trăm giảm (%)</label>
              <input
                type="number"
                name="percentageDiscountValue"
                value={formData.percentageDiscountValue}
                onChange={handleInputChange}
                className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.percentageDiscountValue ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
                min="0"
                max="100"
                step="0.01"
                required
              />
              {formErrors.percentageDiscountValue && <p className="text-xs text-red-500 mt-1">{formErrors.percentageDiscountValue}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.startTime ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
                required
              />
              {formErrors.startTime && <p className="text-xs text-red-500 mt-1">{formErrors.startTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.endTime ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
                required
              />
              {formErrors.endTime && <p className="text-xs text-red-500 mt-1">{formErrors.endTime}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.description ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
                rows="4"
              />
              {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
            </div>
            {selectedPromotion && (
              <div>
                <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`mt-1 p-1.5 w-full border rounded-md text-sm focus:outline-none focus:ring-2 ${formErrors.status ? "border-red-500" : "border-indigo-300 focus:ring-indigo-500"}`}
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
            <div className="col-span-2 flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add/Update Confirmation Modal */}
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isConfirmModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bạn có muốn {selectedPromotion ? "cập nhật" : "thêm mới"} chương trình khuyến mãi này không?
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
            Bạn có chắc chắn muốn xóa chương trình khuyến mãi này không?
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

export default DotGiamGiaAdmin;