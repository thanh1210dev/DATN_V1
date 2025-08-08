import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import axiosInstance from '../../../Service/axiosInstance';
import AuthService from '../../../Service/AuthService';
import { getUserIdByEmail } from '../../../utils/userUtils';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        // Kiểm tra authentication trước khi load giỏ hàng
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        console.log('🔍 [CART AUTH] User:', user);
        console.log('🔍 [CART AUTH] Token exists:', !!token);
        
        if (!user || !token) {
          console.log('🔍 [CART AUTH] No auth data, redirecting to login');
          toast.error('Vui lòng đăng nhập để xem giỏ hàng', {
            position: 'top-right',
            autoClose: 3000,
          });
          navigate('/login');
          return;
        }
        
        // Kiểm tra token còn hợp lệ không
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp < currentTime) {
            console.log('🔍 [CART AUTH] Token expired, redirecting to login');
            toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', {
              position: 'top-right',
              autoClose: 3000,
            });
            AuthService.logout();
            navigate('/login');
            return;
          }
        } catch (error) {
          console.log('🔍 [CART AUTH] Invalid token, redirecting to login');
          toast.error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', {
            position: 'top-right',
            autoClose: 3000,
          });
          AuthService.logout();
          navigate('/login');
          return;
        }
        
        const userId = user.id;
        console.log('🔍 [CART AUTH] Using userId:', userId);
        
        let finalUserId = userId;
        
        // Nếu userId là email, convert sang số
        if (typeof userId === 'string' && userId.includes('@')) {
          console.log('🔍 [CART AUTH] Converting email to numeric ID...');
          try {
            finalUserId = await getUserIdByEmail(userId);
            console.log('🔍 [CART AUTH] Got numeric userId:', finalUserId);
          } catch (error) {
            console.log('🔍 [CART AUTH] Failed to get numeric userId:', error.message);
            toast.error('Không thể tải giỏ hàng, vui lòng thử lại', {
              position: 'top-right',
              autoClose: 3000,
            });
            return;
          }
        }
        
        if (!finalUserId) {
          toast.error('Không tìm thấy thông tin người dùng, vui lòng đăng nhập lại', {
            position: 'top-right',
            autoClose: 3000,
          });
          AuthService.logout();
          navigate('/login');
          return;
        }
        const response = await axiosInstance.get(`/cart-checkout/cart/${finalUserId}`);
        
        // Đảm bảo cartItems luôn là array
        const data = response.data;
        if (Array.isArray(data)) {
          setCartItems(data);
        } else {
          console.warn('Cart data is not an array:', data);
          setCartItems([]);
        }
      } catch (error) {
        console.error('Cart fetch error:', error);
        setCartItems([]); // Reset to empty array on error
        toast.error(error.response?.data?.message || 'Lỗi khi lấy giỏ hàng', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const handleUpdateQuantity = async (cartDetailId, quantity) => {
    try {
      const response = await axiosInstance.put(`/cart-checkout/cart/update-quantity/${cartDetailId}?quantity=${quantity}`);
      
      // Đảm bảo cartItems là array trước khi map
      if (Array.isArray(cartItems)) {
        setCartItems(cartItems.map((item) => (item.id === cartDetailId ? response.data : item)));
      }
      
      toast.success('Cập nhật số lượng thành công', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật số lượng', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleRemoveItem = async (cartDetailId) => {
    try {
      await axiosInstance.delete(`/cart-checkout/cart/remove/${cartDetailId}`);
      
      // Đảm bảo cartItems là array trước khi filter
      if (Array.isArray(cartItems)) {
        setCartItems(cartItems.filter((item) => item.id !== cartDetailId));
      }
      
      // Xóa khỏi danh sách selected nếu có
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartDetailId);
        return newSet;
      });
      
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa sản phẩm', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleSelectItem = (itemId, isSelected) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const getSelectedCartItems = () => {
    return cartItems.filter(item => selectedItems.has(item.id));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ Hàng</h1>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-lg text-gray-500">Đang tải giỏ hàng...</p>
          </div>
        ) : !Array.isArray(cartItems) || cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md p-6">
            <p className="text-lg text-gray-500">Giỏ hàng của bạn đang trống</p>
            <Link
              to="/products"
              className="mt-4 inline-block px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Checkbox chọn tất cả */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={cartItems.length > 0 && selectedItems.size === cartItems.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 mr-3"
                    />
                    <span className="text-lg font-medium text-gray-900">
                      Chọn tất cả ({selectedItems.size}/{cartItems.length})
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <span className="text-sm text-indigo-600 font-medium">
                      Đã chọn {selectedItems.size} sản phẩm
                    </span>
                  )}
                </div>
              </div>

              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onSelectItem={handleSelectItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
            <CartSummary 
              cartItems={cartItems} 
              selectedItems={getSelectedCartItems()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;