import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const name = params.get('name');
    const role = params.get('role');
    const userId = params.get('id'); // Đổi tên biến để rõ ràng

    console.log('✅ OAuth2 Token:', token);
    console.log('✅ Name:', name);
    console.log('✅ Role:', role);
    console.log('✅ User ID:', userId);

    if (token && userId) {
      localStorage.setItem('token', token);
      localStorage.setItem('name', name || '');
      localStorage.setItem('userId', userId); // Sử dụng key "userId"
      localStorage.setItem('selectedRole', role || 'CLIENT');

      switch (role) {
        case 'Staff':
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'CLIENT':
          navigate('/');
          break;
        default:
          navigate('/');
          break;
      }
    } else {
      toast.error('Lỗi xác thực: Thiếu token hoặc ID người dùng', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/login');
    }
  }, [location, navigate]);

  return null;
}

export default OAuth2RedirectHandler;