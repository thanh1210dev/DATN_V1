import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import UserService from '../../../Service/AdminAccountService/UserService';


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
  const navigate = useNavigate();

  // Fetch users
  const fetchUsers = async () => {
    try {
      const data = await UserService.findByCodeAndName(searchCode, searchName, page, size);
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size, searchCode, searchName]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    if (name === 'code') setSearchCode(value);
    if (name === 'name') setSearchName(value);
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
    try {
      const data = await UserService.getById(user.id);
      setIsModalOpen(true);
      setIsEditing(true);
      setEditingId(user.id);
      setFormData({
        role: data.role,
        code: data.code,
        name: data.name,
        birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
        phoneNumber: data.phoneNumber,
        email: data.email,
        password: '', // Không gửi password khi update
        avatar: data.avatar,
      });
    } catch (error) {
      toast.error(error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await UserService.update(editingId, formData);
        toast.success('Cập nhật người dùng thành công!');
      } else {
        await UserService.create(formData);
        toast.success('Thêm người dùng thành công!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error);
    }
  };

  // Handle delete user
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await UserService.delete(deleteId);
      toast.success('Xóa người dùng thành công!');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Navigate back


  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
      <div className="flex items-center gap-4 mb-6">
        
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
        />
        <input
          type="text"
          name="name"
          value={searchName}
          onChange={handleSearchChange}
          placeholder="Tìm theo tên"
          className="block w-1/3 rounded-lg border border-gray-300 shadow-sm px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
        />
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          Tìm kiếm
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
              <th className="px-6 py-3 w-24">Số lần mua</th>
              <th className="px-6 py-3 w-32 rounded-tr-lg">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
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
                  <td className="px-6 py-3 text-center">{item.purchaseCount || 0}</td>
                  <td className="px-6 py-3 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleUpdate(item)}
                      className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <HiOutlinePencilAlt size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      title="Xóa"
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
                  disabled={isEditing}
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
                  maxLength={255}
                  placeholder="Đường dẫn URL"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  {isEditing ? 'Cập nhật' : 'Thêm mới'}
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
                className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountAdmin;