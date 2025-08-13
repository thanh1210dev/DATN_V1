import React, { useState, useEffect, useCallback } from 'react';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
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
    avatar: '', // persisted URL after upload
  });
  // Avatar upload removed per request
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // field -> message

  // Enhanced backend error parser (closure uses setFieldErrors)
  const parseAndShowBackendError = (error, fallbackMessage) => {
    // Accept either axios error object or plain string (e.g., 'phoneNumber: Số điện thoại đã tồn tại')
    if (typeof error === 'string') {
      const parsedStr = parseFieldErrorString(error);
      if (parsedStr) {
        setFieldErrors(prev => ({ ...prev, [parsedStr.field]: parsedStr.message }));
        toast.error(parsedStr.message);
        return;
      }
      toast.error(error);
      return;
    }
    const res = error?.response?.data;
    const mapped = {};
    if (res?.messages && Array.isArray(res.messages)) {
      res.messages.forEach(msg => {
        const parsed = parseFieldErrorString(msg);
        if (parsed) {
          mapped[parsed.field] = parsed.message;
        } else {
          if (/Số điện thoại/.test(msg)) mapped.phoneNumber = msg.replace(/^Số điện thoại:?\s*/, '');
          else if (/Email/.test(msg)) mapped.email = msg.replace(/^Email:?\s*/, '');
          else if (/Mã người dùng/.test(msg)) mapped.code = msg.replace(/^Mã người dùng:?\s*/, '');
          toast.error(msg);
        }
      });
      if (Object.keys(mapped).length) {
        setFieldErrors(mapped);
        Object.values(mapped).forEach(m => toast.error(m));
      }
      return;
    }
    if (res?.message) {
      const parts = String(res.message).split(';').map(s => s.trim()).filter(Boolean);
      const nonField = [];
      parts.forEach(p => {
        const parsed = parseFieldErrorString(p);
        if (parsed) mapped[parsed.field] = parsed.message; else nonField.push(p);
      });
      nonField.forEach(m => {
        if (/Số điện thoại/.test(m)) mapped.phoneNumber = m.replace(/^Số điện thoại:?\s*/, '');
        else if (/Email/.test(m)) mapped.email = m.replace(/^Email:?\s*/, '');
        else if (/Mã người dùng/.test(m)) mapped.code = m.replace(/^Mã người dùng:?\s*/, '');
      });
      if (Object.keys(mapped).length) {
        setFieldErrors(mapped);
        Object.values(mapped).forEach(m => toast.error(m));
      }
      const remaining = nonField.filter(m => !/Số điện thoại|Email|Mã người dùng/.test(m));
      if (!Object.keys(mapped).length && !remaining.length) {
        // fallback to raw message
        toast.error(res.message);
      } else {
        remaining.forEach(m => toast.error(m));
      }
      return;
    }
    toast.error(fallbackMessage || 'Lỗi không xác định');
  };
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await UserService.findByCodeAndName(searchCode, searchName, page, size);
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
  handleBackendError(error, 'Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, [page, size, searchCode, searchName]);

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
    // Clear field error as user edits
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const c = { ...prev }; delete c[name]; return c; });
    }
  };

  // Auto-generate code helper (USR + last 8 digits of timestamp)
  const generateUserCode = () => `USR${Date.now().toString().slice(-8)}`;

  // Avatar file selection
  // Avatar logic removed

  // Handle role select change
  const handleRoleChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, role: selectedOption.value }));
  };

  // Validate form data (strengthened)
  const validateForm = () => {
    if (!formData.code || !/^USR\d{8,}$/.test(formData.code)) {
      toast.error('Mã người dùng phải dạng USR + số');
      return false;
    }
    if (!formData.name || formData.name.length > 100) {
      toast.error('Tên không hợp lệ (<=100 ký tự)');
      return false;
    }
    if (!formData.birthDate) {
      toast.error('Chưa chọn ngày sinh');
      return false;
    }
    const dob = new Date(formData.birthDate);
    if (dob > new Date()) {
      toast.error('Ngày sinh không hợp lệ');
      return false;
    }
    if (new Date().getFullYear() - dob.getFullYear() < 13) {
      toast.error('Tuổi phải >= 13');
      return false;
    }
    if (!/^0\d{9}$/.test(formData.phoneNumber)) {
      toast.error('SĐT phải 10 số và bắt đầu bằng 0');
      return false;
    }
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return false;
    }
    return true;
  };

  // Handle add new user
  const handleAdd = () => {
    setIsModalOpen(true);
    setIsEditing(false);
  setFieldErrors({});
    setFormData({
      role: 'STAFF',
      code: generateUserCode(),
      name: '',
      birthDate: '',
      phoneNumber: '',
      email: '',
      password: '',
      avatar: '', // kept for compatibility but not editable
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
  setFieldErrors({});
      setFormData({
        role: data.role || 'STAFF',
        code: data.code || generateUserCode(),
        name: data.name || '',
        birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        password: '', // Không gửi password khi update
        avatar: data.avatar || '', // preserved but not editable
      });
    } catch (error) {
  parseAndShowBackendError(error, 'Không thể tải thông tin người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Client-side duplicate check (email/phone) against currently loaded list
    const dupEmail = users.find(u => u.email && formData.email && u.email.toLowerCase() === formData.email.toLowerCase() && (!isEditing || u.id !== editingId));
    if (dupEmail) {
      toast.error('Email đã tồn tại trong danh sách hiện tại');
      return;
    }
    const dupPhone = users.find(u => u.phoneNumber && formData.phoneNumber && u.phoneNumber === formData.phoneNumber && (!isEditing || u.id !== editingId));
    if (dupPhone) {
      toast.error('Số điện thoại đã tồn tại trong danh sách hiện tại');
      return;
    }
    // Confirm before submit
    const actionLabel = isEditing ? 'cập nhật' : 'thêm mới';
    if (!window.confirm(`Bạn chắc chắn muốn ${actionLabel} người dùng này?`)) {
      toast.info('Đã hủy thao tác');
      return;
    }
    setIsLoading(true);
    try {
  // Avatar upload removed: send existing avatar value
  const payload = { ...formData };
      if (isEditing) {
        await UserService.update(editingId, {
          ...payload,
          password: payload.password || undefined,
        });
        toast.success('Cập nhật người dùng thành công!');
      } else {
        await UserService.create(payload);
        toast.success('Thêm người dùng thành công!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
  parseAndShowBackendError(error, 'Không thể lưu người dùng');
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
    if (!window.confirm('Bạn có chắc chắn xóa người dùng này?')) {
      toast.info('Đã hủy xóa');
      setIsDeleteModalOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      await UserService.delete(deleteId);
      toast.success('Xóa người dùng thành công!');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
  parseAndShowBackendError(error, 'Không thể xóa người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      role: 'STAFF',
      code: generateUserCode(),
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
  {/* Toast container (only one per page; remove if already in a higher layout) */}
  <ToastContainer position="top-right" autoClose={3000} newestOnTop pauseOnFocusLoss draggable pauseOnHover limit={5} />
  <div className="p-4 md:p-6">
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
  <div className="mb-6 flex flex-col md:flex-row gap-4">
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 min-w-[900px]">
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">{isEditing ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mã</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Vai trò</label>
                      <Select
                        name="role"
                        value={{ value: formData.role, label: formData.role }}
                        onChange={handleRoleChange}
                        options={[
                          { value: 'ADMIN', label: 'ADMIN' },
                          { value: 'STAFF', label: 'STAFF' },
                          { value: 'CLIENT', label: 'CLIENT' },
                        ]}
                        classNamePrefix="react-select"
                        isDisabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tên</label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        required
                        maxLength={100}
                      />
                      {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        required
                      />
                      {fieldErrors.birthDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.birthDate}</p>}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Số điện thoại</label>
                      <input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="0xxxxxxxxx"
                        required
                        maxLength={10}
                      />
                      {fieldErrors.phoneNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.phoneNumber}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        required
                      />
                      {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                    </div>
                    {!isEditing && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Mật khẩu</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          minLength={6}
                          required
                        />
                        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
                      </div>
                    )}
                    {/* Avatar upload removed */}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
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
// Parse backend errors -> toast + field level mapping
function parseFieldErrorString(str) {
  // Expect patterns like "field: message"
  const idx = str.indexOf(':');
  if (idx === -1) return null;
  const field = str.slice(0, idx).trim();
  const message = str.slice(idx + 1).trim();
  if (!field) return null;
  return { field, message };
}

// Will be replaced inside component via closure; fallback silent
function parseAndShowBackendError(error, fallbackMessage) {
  // Placeholder (overwritten in component scope if needed)
  const res = error?.response?.data;
  if (res?.message) toast.error(res.message); else toast.error(fallbackMessage || 'Lỗi');
}
