import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/user/forgot-password', { email });
      setDone(true);
      toast.success('Vui lòng kiểm tra email để đặt lại mật khẩu');
    } catch (err) {
      const msg = err?.response?.data || 'Không thể yêu cầu đặt lại mật khẩu';
      toast.error(typeof msg === 'string' ? msg : 'Không thể yêu cầu đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-2">Quên mật khẩu</h1>
        <p className="text-gray-500 mb-4">Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
        {done ? (
          <div className="text-green-700 bg-green-50 p-4 rounded">Đã gửi email nếu email tồn tại trong hệ thống.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"/>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-60">{loading ? 'Đang gửi...' : 'Gửi liên kết'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
