import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthService from "../../../Service/AuthService";
import axiosInstance from "../../../Service/axiosInstance";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalUserInfo, setOriginalUserInfo] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    // Kiểm tra authentication
    const currentUser = AuthService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    console.log('🔍 [PROFILE AUTH] User:', currentUser);
    console.log('🔍 [PROFILE AUTH] Token exists:', !!token);
    
    if (!currentUser || !token) {
      console.log('🔍 [PROFILE AUTH] No auth data, redirecting to login');
      toast.error('Vui lòng đăng nhập để xem thông tin cá nhân', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
      return;
    }
    
    // Kiểm tra token còn hợp lệ không
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp < currentTime) {
        console.log('🔍 [PROFILE AUTH] Token expired, redirecting to login');
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
        AuthService.logout();
        navigate('/login');
        return;
      }
    } catch (error) {
      console.log('🔍 [PROFILE AUTH] Invalid token, redirecting to login');
      toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', { position: 'top-right', autoClose: 3000 });
      AuthService.logout();
      navigate('/login');
      return;
    }
    
    setUser(currentUser);
    const initial = {
      name: currentUser.name || '',
      email: currentUser.email || '',
      phoneNumber: currentUser.phoneNumber || '',
      address: currentUser.address || '',
      dateOfBirth: currentUser.dateOfBirth || ''
    };
    setUserInfo(initial);
    setOriginalUserInfo(initial);
  }, [navigate]);

  // Compute changed fields diff
  const changes = useMemo(() => {
    if (!originalUserInfo) return [];
    const diff = [];
    Object.keys(userInfo).forEach(k => {
      if ((originalUserInfo[k] || '') !== (userInfo[k] || '')) {
        diff.push({ field: k, from: originalUserInfo[k] || '—', to: userInfo[k] || '—' });
      }
    });
    return diff;
  }, [originalUserInfo, userInfo]);

  // Không hiển thị gì nếu chưa có user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra thông tin đăng nhập...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    if (!userInfo.name.trim()) {
      toast.error('Tên không được để trống');
      return false;
    }
    if (userInfo.phoneNumber && !/^0\d{9}$/.test(userInfo.phoneNumber)) {
      toast.error('Số điện thoại phải 10 số và bắt đầu bằng 0');
      return false;
    }
    if (userInfo.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(userInfo.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (userInfo.dateOfBirth) {
      const dob = new Date(userInfo.dateOfBirth);
      if (dob > new Date()) {
        toast.error('Ngày sinh không hợp lệ');
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (changes.length === 0) {
      toast.info('Không có thay đổi nào');
      setIsEditing(false);
      return;
    }
    setShowConfirm(true);
  };

  const performSave = async () => {
    try {
      setPendingSave(true);
      await axiosInstance.put(`/users/${user.id}`, userInfo);
      toast.success('Cập nhật thông tin thành công!', { position: 'top-right', autoClose: 3000 });
      setIsEditing(false);
      setShowConfirm(false);
      setOriginalUserInfo(userInfo);
      const updatedUser = { ...user, ...userInfo };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin', { position: 'top-right', autoClose: 3000 });
    } finally {
      setPendingSave(false);
    }
  };

  const handleCancel = () => {
    if (changes.length > 0) {
      if (!window.confirm('Bạn có chắc muốn hủy các thay đổi?')) return;
      toast.info('Đã hủy thay đổi');
    }
    setUserInfo(originalUserInfo || userInfo);
    setIsEditing(false);
  };

  const startEditing = () => {
    setOriginalUserInfo(userInfo); // snapshot for diff
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ToastContainer />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={userInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{userInfo.name || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={userInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{userInfo.email || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userInfo.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{userInfo.phoneNumber || 'Chưa cập nhật'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={userInfo.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {userInfo.dateOfBirth ? new Date(userInfo.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={userInfo.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{userInfo.address || 'Chưa cập nhật'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                ID người dùng: {user?.id}
              </p>
              <p className="text-sm text-gray-500">
                Vai trò: {user?.role === 'CLIENT' ? 'Khách hàng' : user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Xác nhận lưu thay đổi</h3>
              <button onClick={() => setShowConfirm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 max-h-[55vh] overflow-y-auto text-sm">
              {changes.length === 0 ? (
                <p className="text-gray-600">Không có thay đổi.</p>
              ) : (
                <ul className="space-y-3">
                  {changes.map(c => (
                    <li key={c.field} className="bg-gray-50 rounded p-3 border border-gray-200">
                      <p className="font-medium text-gray-700 mb-1">{c.field}</p>
                      <div className="text-xs text-gray-600">
                        <span className="line-through mr-2 text-red-500">{c.from || '—'}</span>
                        <span className="text-green-600">→ {c.to || '—'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-gray-500">Vui lòng kiểm tra kỹ trước khi xác nhận.</p>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setShowConfirm(false); toast.info('Đã hủy lưu'); }}
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-white"
                disabled={pendingSave}
              >
                Hủy
              </button>
              <button
                onClick={performSave}
                disabled={pendingSave}
                className="px-5 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {pendingSave ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;