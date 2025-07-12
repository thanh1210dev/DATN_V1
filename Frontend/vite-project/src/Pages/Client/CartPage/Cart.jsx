import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import axiosInstance from '../../../Service/axiosInstance';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Vui lòng đăng nhập để xem giỏ hàng', {
            position: 'top-right',
            autoClose: 3000,
          });
          navigate('/login');
          return;
        }
        const response = await axiosInstance.get(`/cart-checkout/cart/${userId}`);
        setCartItems(response.data || []);
      } catch (error) {
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
      setCartItems(cartItems.map((item) => (item.id === cartDetailId ? response.data : item)));
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
      setCartItems(cartItems.filter((item) => item.id !== cartDetailId));
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ Hàng</h1>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-lg text-gray-500">Đang tải giỏ hàng...</p>
          </div>
        ) : cartItems.length === 0 ? (
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
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
            <CartSummary cartItems={cartItems} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;