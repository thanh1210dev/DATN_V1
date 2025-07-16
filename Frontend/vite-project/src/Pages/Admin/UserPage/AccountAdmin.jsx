<<<<<<< HEAD
=======

>>>>>>> b40b5adc0c09f76af5142cac40e188037654fa66
import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';

import UserService from '../../../Service/AdminAccountService/UserService';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600">Đã xảy ra lỗi</h3>
          <p className="text-sm text-gray-600 mt-2">{this.state.error?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AccountAdmin = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    role: 'STAFF',
    code: '',
    name: '',
    birthDate: '',
    phoneNumber: '',
    email: '',
    password: '',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
<<<<<<< HEAD


  // Fetch users
  const fetchUsers = useCallback(async () => {
=======
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
>>>>>>> b40b5adc0c09f76af5142cac40e188037654fa66
    try {
      const data = await UserService.findByCodeAndName(searchCode, searchName, page, size);
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
<<<<<<< HEAD
  }, [searchCode, searchName, page, size]);
=======
  }, [page, size, searchCode, searchName]);
>>>>>>> b40b5adc0c09f76af5142cac40e188037654fa66

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    if (name === 'code') setSearchCode(value);
    if (name === 'name') setSearchName(value);
    setPage(0); // Reset to first page on search
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle role select change
  const handleRoleChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, role: selectedOption.value }));
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.code || formData.code.length > 50) {
      toast.error('Mã người dùng không hợp lệ (tối đa 50 ký tự)');
      return false;
    }
    if (!formData.name || formData.name.length > 100) {
      toast.error('Tên người dùng không hợp lệ (tối đa 100 ký tự)');
      return false;
    }
    if (!formData.birthDate) {
      toast.error('Vui lòng chọn ngày sinh');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error('Số điện thoại phải có đúng 10 chữ số');
      return false;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (formData.avatar && !/^https?:\/\/.*\.(?:png|jpg|jpeg|gif)$/.test(formData.avatar)) {
      toast.error('URL ảnh đại diện không hợp lệ');
      return false;
    }
    return true;
  };

  // Handle add new user
  const handleAdd = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setFormData({
      role: 'STAFF',
      code: '',
      name: '',
      birthDate: '',
      phoneNumber: '',
      email: '',
      password: '',
      avatar: '',
    });
  };

  // Handle update user
  const handleUpdate = async (user) => {
    setIsLoading(true);
    try {
      const data = await UserService.getById(user.id);
      setIsModalOpen(true);
      setIsEditing(true);
      setEditingId(user.id);
      setFormData({
        role: data.role || 'STAFF',
        code: data.code || '',
        name: data.name || '',
        birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        password: '', // Không gửi password khi update
        avatar: data.avatar || '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isEditing) {
        await UserService.update(editingId, {
          ...formData,
          password: formData.password || undefined, // Không gửi password nếu rỗng
        });
        toast.success('Cập nhật người dùng thành công!');
      } else {
        await UserService.create(formData);
        toast.success('Thêm người dùng thành công!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await UserService.delete(deleteId);
      toast.success('Xóa người dùng thành công!');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      role: 'STAFF',
      code: '',
      name: '',
      birthDate: '',
      phoneNumber: '',
      email: '',
      password: '',
      avatar: '',
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // Navigate back to dashboard
  const handleBack = () => {
    navigate('/admin/dashboard'); // Adjust the route as needed
  };

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
            title="Quay lại"
          >
            <HiOutlineArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">Quản lý tài khoản</h2>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            name="code"
            value={searchCode}
            onChange={handleSearchChange}
            placeholder="Tìm theo mã"
            className="block w-1/3 rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            disabled={isLoading}
          />
          <input
            type="text"
            name="name"
            value={searchName}
            onChange={handleSearchChange}
            placeholder="Tìm theo tên"
            className="block w-1/3 rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            disabled={isLoading}
          />
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Đang tải...' : 'Tìm kiếm'}
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <HiOutlinePlus className="mr-2" size={16} />
            Thêm mới
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs font-semibold uppercase bg-indigo-50 text-indigo-700">
              <tr>
                <th className="px-6 py-3 w-16 rounded-tl-lg">#</th>
                <th className="px-6 py-3 w-24">Vai trò</th>
                <th className="px-6 py-3 w-32">Mã</th>
                <th className="px-6 py-3">Tên</th>
                <th className="px-6 py-3 w-32">Ngày sinh</th>
                <th className="px-6 py-3 w-32">Số điện thoại</th>
                <th className="px-6 py-3 w-40">Email</th>
                <th className="px-6 py-3 w-24">Điểm tích lũy</th>
                <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500 text-sm">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500 text-sm">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                users.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-center">{page * size + index + 1}</td>
                    <td className="px-6 py-3">{item.role}</td>
                    <td className="px-6 py-3">{item.code}</td>
                    <td className="px-6 py-3">{item.name}</td>
                    <td className="px-6 py-3">{item.birthDate ? item.birthDate.split('T')[0] : '-'}</td>
                    <td className="px-6 py-3">{item.phoneNumber || '-'}</td>
                    <td className="px-6 py-3">{item.email || '-'}</td>
                    <td className="px-6 py-3 text-center">{item.loyaltyPoints || 0}</td>
                    <td className="px-6 py-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleUpdate(item)}
                        className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                        title="Chỉnh sửa"
                        disabled={isLoading}
                      >
                        <HiOutlinePencilAlt size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                        title="Xóa"
                        disabled={isLoading}
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || page === 0}
            >
              ← Trước
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || page + 1 >= totalPages}
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
            disabled={isLoading}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">
                {isEditing ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <Select
                    name="role"
                    value={{ value: formData.role, label: formData.role }}
                    onChange={handleRoleChange}
                    options={[
                      { value: 'ADMIN', label: 'ADMIN' },
                      { value: 'STAFF', label: 'STAFF' },
                    ]}
                    placeholder="Chọn vai trò"
                    isSearchable
                    className="text-sm"
                    isDisabled={isLoading}
                    required
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã người dùng</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isEditing || isLoading}
                    required
                    maxLength={50}
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                    required
                    maxLength={10}
                    pattern="\d{10}"
                    placeholder="10 chữ số"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                    required={!isEditing}
                    minLength={6}
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện</label>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
                    disabled={isLoading}
                    maxLength={255}
                    placeholder="Đường dẫn URL (png, jpg, jpeg, gif)"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-sm transform transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Xác nhận xóa</h3>
              <p className="text-sm text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa tài khoản này không?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AccountAdmin;
