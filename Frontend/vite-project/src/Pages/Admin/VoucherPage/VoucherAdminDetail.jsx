import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { HiOutlineSearch, HiOutlineEye } from "react-icons/hi";
import { FaMedal, FaGem, FaStar, FaTrophy } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VoucherApi from "../../../Service/AdminDotGiamGiaSevice/VoucherApi";
import UserApi from "../../../Service/AdminUserService/UserApi";

const VoucherAdminDetail = () => {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchCode, setSearchCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPhoneNumber, setSearchPhoneNumber] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isBirthday, setIsBirthday] = useState(false);
  const [isTopPurchaser, setIsTopPurchaser] = useState(false);
  const [memberTier, setMemberTier] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userVouchers, setUserVouchers] = useState([]);
  const [voucherPage, setVoucherPage] = useState(0);
  const [voucherSize, setVoucherSize] = useState(5);
  const [voucherTotalPages, setVoucherTotalPages] = useState(1);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignQuantity, setAssignQuantity] = useState(1);

  const statusLabels = {
    COMING_SOON: "Sắp ra mắt",
    ACTIVE: "Đang hoạt động",
    EXPIRED: "Hết hạn",
    USED_UP: "Hết lượt",
    INACTIVE: "Không hoạt động",
  };

  const typeLabels = {
    FIXED: "Giảm cố định",
    PERCENT: "Giảm phần trăm",
  };

  const memberTierOptions = [
    { value: "", label: "Tất cả hạng thành viên" },
    { value: "BRONZE", label: "Đồng (< 500 điểm)", icon: <FaMedal className="inline-block mr-2 text-bronze-600" /> },
    { value: "SILVER", label: "Bạc (500-999 điểm)", icon: <FaMedal className="inline-block mr-2 text-silver-400" /> },
    { value: "GOLD", label: "Vàng (1000-1999 điểm)", icon: <FaStar className="inline-block mr-2 text-yellow-400" /> },
    { value: "PLATINUM", label: "Bạch kim (≥ 2000 điểm)", icon: <FaGem className="inline-block mr-2 text-blue-400" /> },
  ];

  const getMemberTier = (points) => {
    if (points >= 2000) return { label: "Bạch kim", icon: <FaGem className="inline-block mr-2 text-blue-400" /> };
    if (points >= 1000) return { label: "Vàng", icon: <FaStar className="inline-block mr-2 text-yellow-400" /> };
    if (points >= 500) return { label: "Bạc", icon: <FaMedal className="inline-block mr-2 text-silver-400" /> };
    return { label: "Đồng", icon: <FaMedal className="inline-block mr-2 text-bronze-600" /> };
  };

  useEffect(() => {
    fetchVoucher();
    fetchUsers();
  }, [id, page, size, searchCode, searchName, searchPhoneNumber, searchEmail, startDate, endDate, isBirthday, isTopPurchaser, memberTier]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserVouchers();
    }
  }, [selectedUserId, voucherPage, voucherSize]);

  const fetchVoucher = async () => {
    try {
      const response = await VoucherApi.getVoucherById(id);
      setVoucher(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải chi tiết voucher", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const params = {
        code: searchCode || undefined,
        name: searchName || undefined,
        phoneNumber: searchPhoneNumber || undefined,
        email: searchEmail || undefined,
        minLoyaltyPoints: memberTier === "BRONZE" ? 0 : memberTier === "SILVER" ? 500 : memberTier === "GOLD" ? 1000 : memberTier === "PLATINUM" ? 2000 : undefined,
        maxLoyaltyPoints: memberTier === "BRONZE" ? 499 : memberTier === "SILVER" ? 999 : memberTier === "GOLD" ? 1999 : undefined,
        birthDate: isBirthday ? `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}` : undefined,
        startDate: isTopPurchaser ? startDate || undefined : undefined,
        endDate: isTopPurchaser ? endDate || undefined : undefined,
        page,
        size,
      };
      const response = await UserApi.search(params);
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải danh sách người dùng", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const fetchUserVouchers = async () => {
    try {
      const response = await VoucherApi.UserVoucher(selectedUserId, voucherPage, voucherSize);
      setUserVouchers(response.data.content || []);
      setVoucherTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải danh sách voucher của người dùng", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
    setSelectAll(!selectAll);
  };

  const openAssignModal = () => {
    if (selectedUsers.length === 0) {
      toast.warn("Vui lòng chọn ít nhất một người dùng", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    setAssignQuantity(1);
    setIsAssignModalOpen(true);
  };

  const handleAssignVoucher = async () => {
    if (assignQuantity <= 0) {
      toast.warn("Số lượng voucher phải lớn hơn 0", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    try {
      const request = {
        voucherId: parseInt(id),
        userIds: selectedUsers,
        quantity: assignQuantity,
      };
      await VoucherApi.assign(request);
      toast.success("Phân voucher thành công!", {
        position: "top-right",
        autoClose: 5000,
      });
      setSelectedUsers([]);
      setSelectAll(false);
      setIsAssignModalOpen(false);
      fetchVoucher();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi phân voucher", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleViewUserVouchers = (userId) => {
    setSelectedUserId(userId);
    setVoucherPage(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    setUserVouchers([]);
    setVoucherPage(0);
    setVoucherTotalPages(1);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignQuantity(1);
  };

  if (!voucher) {
    return <div className="p-6 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      {/* Voucher Details */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-indigo-700 mb-6">Chi tiết Voucher</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Mã</p>
            <p className="text-sm font-medium text-gray-800">{voucher.code}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Tên</p>
            <p className="text-sm font-medium text-gray-800">{voucher.name}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Loại</p>
            <p className="text-sm font-medium text-gray-800">{typeLabels[voucher.type] || voucher.type}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Trạng thái</p>
            <p className="text-sm font-medium text-gray-800">{statusLabels[voucher.status]}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Số lượng</p>
            <p className="text-sm font-medium text-gray-800">{voucher.quantity || "-"}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Giá trị giảm</p>
            <p className="text-sm font-medium text-gray-800">
              {voucher.type === "PERCENT" && voucher.percentageDiscountValue
                ? `${voucher.percentageDiscountValue}%`
                : voucher.fixedDiscountValue
                ? `${voucher.fixedDiscountValue} VND`
                : "-"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Giá trị giảm tối đa</p>
            <p className="text-sm font-medium text-gray-800">
              {voucher.maxDiscountValue ? `${voucher.maxDiscountValue} VND` : "-"}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm col-span-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Thời gian</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(voucher.startTime).toLocaleString()} - {new Date(voucher.endTime).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Tìm kiếm mã..."
              className="pl-8 pr-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
            <HiOutlineSearch className="absolute left-2 top-2.5 text-indigo-400" size={18} />
          </div>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Tìm kiếm tên..."
            className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          <input
            type="text"
            value={searchPhoneNumber}
            onChange={(e) => setSearchPhoneNumber(e.target.value)}
            placeholder="Tìm kiếm số điện thoại..."
            className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Tìm kiếm email..."
            className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Tìm kiếm
          </button>
        </form>
        <div className="flex items-center gap-3">
          <select
            value={memberTier}
            onChange={(e) => setMemberTier(e.target.value)}
            className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          >
            {memberTierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isBirthday}
              onChange={(e) => setIsBirthday(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Sinh nhật hôm nay</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isTopPurchaser}
              onChange={(e) => setIsTopPurchaser(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Top người mua</span>
          </label>
          {isTopPurchaser && (
            <>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Từ ngày"
                  className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Đến ngày"
                  className="px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                />
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {selectAll ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
          <button
            onClick={openAssignModal}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Phân Voucher
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
              </th>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Ngày sinh</th>
              <th className="px-4 py-3">Điểm trung thành</th>
              <th className="px-4 py-3">Hạng thành viên</th>
              <th className="px-4 py-3 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-gray-500 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const tier = getMemberTier(user.loyaltyPoints);
                return (
                  <tr key={user.id} className="border-b hover:bg-indigo-50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">{page * size + index + 1}</td>
                    <td className="px-4 py-3">{user.code}</td>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.phoneNumber}</td>
                    <td className="px-4 py-3">
                      {user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3">{user.loyaltyPoints || 0}</td>
                    <td className="px-4 py-3">{tier.icon} {tier.label}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewUserVouchers(user.id)}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <HiOutlineEye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page + 1 >= totalPages}
          >
            Tiếp →
          </button>
        </div>
        <select
          className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Assign Voucher Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all duration-300">
            <h3 className="text-lg font-bold text-indigo-700 mb-4">Phân Voucher</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng voucher cho mỗi người dùng
              </label>
              <input
                type="number"
                min="1"
                value={assignQuantity}
                onChange={(e) => setAssignQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập số lượng"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignVoucher}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Vouchers Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 transform transition-all duration-300">
            <h3 className="text-lg font-bold text-indigo-700 mb-4">Danh sách Voucher của người dùng</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">#</th>
                    <th className="px-4 py-3">Tên Voucher</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Số lượng nhận</th>
                    <th className="px-4 py-3 rounded-tr-lg">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {userVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-gray-500 text-sm">
                        Không có voucher
                      </td>
                    </tr>
                  ) : (
                    userVouchers.map((voucher, index) => (
                      <tr key={voucher.id} className="border-b hover:bg-indigo-50 transition-colors">
                        <td className="px-4 py-3 text-center">{voucherPage * voucherSize + index + 1}</td>
                        <td className="px-4 py-3">{voucher.voucherName}</td>
                        <td className="px-4 py-3">{statusLabels[voucher.voucherStatus] || voucher.voucherStatus}</td>
                        <td className="px-4 py-3">{voucher.quantity}</td>
                        <td className="px-4 py-3">{new Date(voucher.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Modal Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVoucherPage((prev) => Math.max(prev - 1, 0))}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={voucherPage === 0}
                >
                  ← Trước
                </button>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm">
                  Trang {voucherPage + 1} / {voucherTotalPages}
                </span>
                <button
                  onClick={() => setVoucherPage((prev) => Math.min(prev + 1, voucherTotalPages - 1))}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={voucherPage + 1 >= voucherTotalPages}
                >
                  Tiếp →
                </button>
              </div>
              <select
                className="bg-white text-gray-700 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={voucherSize}
                onChange={(e) => {
                  setVoucherSize(parseInt(e.target.value));
                  setVoucherPage(0);
                }}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherAdminDetail;