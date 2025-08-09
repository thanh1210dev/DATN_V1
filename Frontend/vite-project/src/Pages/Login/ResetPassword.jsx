import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    setToken(params.get('token') || '');
  }, [location.search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/user/reset-password', { token, newPassword });
      toast.success('Đặt lại mật khẩu thành công, vui lòng đăng nhập');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data || 'Không thể đặt lại mật khẩu';
      toast.error(typeof msg === 'string' ? msg : 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-2">Đặt lại mật khẩu</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"/>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-60">{loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}</button>
        </form>
      </div>
    </div>
  );
}
