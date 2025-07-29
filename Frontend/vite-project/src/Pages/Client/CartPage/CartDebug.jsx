import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../Service/axiosInstance';

const CartDebug = () => {
  const [cartData, setCartData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId') || '1';
    setUserId(storedUserId);
  }, []);

  const testCartAPI = async () => {
    setIsLoading(true);
    setError(null);
    setCartData(null);
    
    try {
      console.log('Testing cart API with userId:', userId);
      
      const response = await axiosInstance.get(`/cart-checkout/cart/${userId}`);
      
      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      console.log('Is array:', Array.isArray(response.data));
      console.log('Type:', typeof response.data);
      
      setCartData({
        data: response.data,
        isArray: Array.isArray(response.data),
        type: typeof response.data,
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });
      
    } catch (err) {
      console.error('Cart API error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testAddToCart = async () => {
    try {
      setError(null);
      console.log('Testing add to cart...');
      
      // Test add với productDetailId mặc định
      const testProductDetailId = 1;
      const response = await axiosInstance.post(`/cart-checkout/cart/add?userId=${userId}&productDetailId=${testProductDetailId}&quantity=1`);
      
      console.log('Add to cart response:', response);
      alert('Added to cart successfully!');
      
      // Refresh cart data
      testCartAPI();
      
    } catch (err) {
      console.error('Add to cart error:', err);
      setError('Add to cart failed: ' + err.message);
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      
      if (cartData && cartData.isArray && cartData.data.length > 0) {
        // Remove all items
        for (const item of cartData.data) {
          await axiosInstance.delete(`/cart-checkout/cart/remove/${item.id}`);
        }
        alert('Cart cleared!');
        testCartAPI();
      } else {
        alert('Cart is already empty!');
      }
      
    } catch (err) {
      console.error('Clear cart error:', err);
      setError('Clear cart failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cart API Debug</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User ID:
        </label>
        <input 
          type="text" 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-32"
        />
      </div>
      
      <div className="space-x-2 mb-4">
        <button 
          onClick={testCartAPI}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Get Cart'}
        </button>
        
        <button 
          onClick={testAddToCart}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Add To Cart
        </button>
        
        <button 
          onClick={clearCart}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Cart
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {cartData && (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-semibold">API Response Info:</h3>
            <ul className="mt-2 space-y-1">
              <li><strong>Is Array:</strong> {cartData.isArray ? 'Yes ✅' : 'No ❌'}</li>
              <li><strong>Type:</strong> {cartData.type}</li>
              <li><strong>Length:</strong> {cartData.length}</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gray-100 border border-gray-300 rounded">
            <h3 className="font-semibold">Raw Data:</h3>
            <pre className="mt-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(cartData.data, null, 2)}
            </pre>
          </div>
          
          {cartData.isArray && cartData.data.length > 0 && (
            <div className="p-4 bg-blue-100 border border-blue-300 rounded">
              <h3 className="font-semibold">Cart Items:</h3>
              <div className="mt-2 space-y-2">
                {cartData.data.map((item, index) => (
                  <div key={index} className="text-sm border-b pb-2">
                    <strong>Item {index + 1}:</strong> {item.productName || 'No name'}<br/>
                    <span>Qty: {item.quantity} - Price: {item.price?.toLocaleString()} VND</span><br/>
                    <span>Size: {item.sizeName} - Color: {item.colorName}</span><br/>
                    <span>ID: {item.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <h3 className="font-semibold">Test Steps:</h3>
        <ol className="mt-2 text-sm space-y-1 list-decimal list-inside">
          <li>Kiểm tra userId trong localStorage: <strong>{localStorage.getItem('userId') || 'Không có'}</strong></li>
          <li>Click "Test Get Cart" để xem cart hiện tại</li>
          <li>Click "Test Add To Cart" để thêm 1 sản phẩm test</li>
          <li>Click "Test Get Cart" lại để xem cart có cập nhật không</li>
          <li>Truy cập <a href="/cart" className="underline">/cart</a> để test UI</li>
          <li>Backend test: <a href="http://localhost:8080/api/cart-checkout/test" target="_blank" className="underline">Test Backend</a></li>
        </ol>
      </div>
    </div>
  );
};

export default CartDebug;
