import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import ShippingForm from './ShippingForm';
import { HiOutlineTrash } from 'react-icons/hi';
import AuthService from '../../../Service/AuthService';
import { getCurrentUserId } from '../../../utils/userUtils';

const AddressSelector = ({ selectedAddressId, setSelectedAddressId, setShippingInfo, onNext }) => {
  const [addresses, setAddresses] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // Địa chỉ đang sửa

  // Helper function để lấy userId an toàn
  const getAuthenticatedUserId = async () => {
    const user = AuthService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      return null;
    }
    
    // Kiểm tra token còn hợp lệ không
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp < currentTime) {
        return null;
      }
    } catch (error) {
      return null;
    }
    
    // Lấy userId từ JWT token
    const userId = await getCurrentUserId();
    return userId;
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        setIsLoading(true);
        
        // Kiểm tra authentication trước khi lấy địa chỉ
        const user = AuthService.getCurrentUser();
        const token = localStorage.getItem('token');
        
        console.log('=== ADDRESS SELECTOR AUTH DEBUG ===');
        console.log('User:', user);
        console.log('Token exists:', !!token);
        
        if (!user || !token) {
          console.log('No auth data in AddressSelector');
          setAddresses([]);
          return;
        }
        
        // Kiểm tra token còn hợp lệ không
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp < currentTime) {
            console.log('Token expired in AddressSelector');
            setAddresses([]);
            return;
          }
        } catch (error) {
          console.log('Invalid token in AddressSelector');
          setAddresses([]);
          return;
        }
        
        // Lấy userId từ JWT token
        const userId = await getCurrentUserId();
        console.log('=== FETCH ADDRESSES DEBUG ===');
        console.log('User ID from JWT:', userId);
        
        if (!userId || isNaN(userId) || parseInt(userId) <= 0) {
          console.log('UserId không hợp lệ:', userId);
          setAddresses([]);
          return;
        }

        console.log('Đang lấy địa chỉ người dùng:', userId);
        
        const response = await axiosInstance.get(`/cart-checkout/address/${userId}`, {
          signal: controller.signal
        });
        
        console.log('Raw response from server:', response.data);
        
        // Đảm bảo response.data là một mảng
        const addressList = Array.isArray(response.data) ? response.data : [];
        console.log('Đã lấy được', addressList.length, 'địa chỉ');
        
        // Lọc bỏ các địa chỉ không hợp lệ
        const validAddresses = addressList.filter(addr => (
          addr && 
          addr.id && 
          addr.name && 
          addr.phoneNumber && 
          addr.address && 
          addr.provinceId && 
          addr.districtId && 
          addr.wardCode
        ));
        
        console.log('Filtered valid addresses:', validAddresses);
        setAddresses(validAddresses);
        
        // Tự động chọn địa chỉ mặc định nếu có
        const defaultAddress = validAddresses.find((addr) => addr.isDefault);
        if (defaultAddress && !selectedAddressId) {
          console.log('Đã tìm thấy địa chỉ mặc định:', defaultAddress.id);
          setSelectedAddressId(defaultAddress.id);
          setShippingInfo({
            id: defaultAddress.id,
            name: defaultAddress.name,
            phoneNumber: defaultAddress.phoneNumber,
            address: defaultAddress.address,
            provinceName: defaultAddress.provinceName || '',
            provinceId: defaultAddress.provinceId,
            districtName: defaultAddress.districtName || '',
            districtId: defaultAddress.districtId,
            wardName: defaultAddress.wardName || '',
            wardCode: defaultAddress.wardCode
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy địa chỉ:', error);
        setAddresses([]);
        // Chỉ hiển thị toast khi không phải lỗi timeout hoặc network
        if (error.name !== 'AbortError' && error.message !== 'Network Error') {
          toast.error('Không thể lấy danh sách địa chỉ, vui lòng thử lại sau', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } finally {
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchAddresses();
  }, [setSelectedAddressId, setShippingInfo]);

  // useEffect để tự động chọn địa chỉ mặc định khi addresses được load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        console.log('🏠 Auto-selecting default address on mount:', defaultAddress.id);
        setSelectedAddressId(defaultAddress.id);
        setShippingInfo({
          id: defaultAddress.id,
          name: defaultAddress.name,
          phoneNumber: defaultAddress.phoneNumber,
          address: defaultAddress.address,
          provinceName: defaultAddress.provinceName || '',
          provinceId: defaultAddress.provinceId,
          districtName: defaultAddress.districtName || '',
          districtId: defaultAddress.districtId,
          wardName: defaultAddress.wardName || '',
          wardCode: defaultAddress.wardCode
        });
      } else if (addresses.length === 1) {
        // Nếu chỉ có 1 địa chỉ thì tự động chọn
        const singleAddress = addresses[0];
        console.log('🏠 Auto-selecting single address:', singleAddress.id);
        setSelectedAddressId(singleAddress.id);
        setShippingInfo({
          id: singleAddress.id,
          name: singleAddress.name,
          phoneNumber: singleAddress.phoneNumber,
          address: singleAddress.address,
          provinceName: singleAddress.provinceName || '',
          provinceId: singleAddress.provinceId,
          districtName: singleAddress.districtName || '',
          districtId: singleAddress.districtId,
          wardName: singleAddress.wardName || '',
          wardCode: singleAddress.wardCode
        });
      }
    }
  }, [addresses, selectedAddressId]);

  // Thêm địa chỉ mới
  const handleAddNewAddress = async (newAddress) => {
    try {
      const userId = await getAuthenticatedUserId();
      if (!userId || isNaN(userId) || parseInt(userId) <= 0) {
        toast.error('Vui lòng đăng nhập để thêm địa chỉ', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }

      setIsLoading(true);
      
      // CHỈ TỰ ĐỘNG SET DEFAULT KHI ĐÂY LÀ ĐỊA CHỈ ĐẦU TIÊN
      const addressData = {
        name: newAddress.name,
        phoneNumber: newAddress.phoneNumber,
        address: newAddress.address,
        provinceId: newAddress.provinceId,
        provinceName: newAddress.provinceName || '',
        districtId: newAddress.districtId,
        districtName: newAddress.districtName || '',
        wardCode: newAddress.wardCode,
        wardName: newAddress.wardName || '',
        isDefault: addresses.length === 0, // Chỉ set default nếu đây là địa chỉ đầu tiên
      };

      console.log('=== ADD NEW ADDRESS DEBUG ===');
      console.log('Adding new address:', addressData);
      console.log('Current addresses count:', addresses.length);
      console.log('Will be set as default:', addressData.isDefault);

      const response = await axiosInstance.post(`/cart-checkout/address/${userId}`, addressData);
      console.log('Add address response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Response keys:', response.data ? Object.keys(response.data) : 'null/undefined');
      
      // Kiểm tra response và tạo fallback nếu cần
      let newAddressWithId = null;
      
      if (response.data && typeof response.data === 'object') {
        // Nếu có response data hợp lệ
        newAddressWithId = {
          ...response.data,
          id: response.data.id || Date.now(), // Fallback ID nếu server không trả về
        };
        console.log('Using server response data with ID:', newAddressWithId.id);
      } else {
        // Fallback: tạo từ dữ liệu request
        console.warn('Server response invalid, creating fallback address from request data');
        newAddressWithId = {
          ...addressData,
          id: Date.now(), // Generate timestamp ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deleted: false
        };
        console.log('Using fallback address data with ID:', newAddressWithId.id);
      }
      
      // Đảm bảo có ID trước khi tiếp tục
      if (!newAddressWithId || !newAddressWithId.id) {
        console.error('Failed to create address with valid ID');
        throw new Error('Không thể tạo địa chỉ với ID hợp lệ');
      }
      
      console.log('Final address to add:', newAddressWithId);
      
      const updatedAddresses = [newAddressWithId, ...addresses];
      console.log('New addresses after add:', updatedAddresses);
      
      setAddresses(updatedAddresses);
      setSelectedAddressId(newAddressWithId.id);
      setShippingInfo({
        ...newAddressWithId
      });
      setIsAddingNew(false);
        
        // REFETCH addresses từ server để đảm bảo đồng bộ
        setTimeout(async () => {
          try {
            const refreshResponse = await axiosInstance.get(`/cart-checkout/address/${userId}`);
            const refreshedAddresses = Array.isArray(refreshResponse.data) ? refreshResponse.data : [];
            console.log('Refreshed addresses after add:', refreshedAddresses);
            setAddresses(refreshedAddresses);
            
            // Ensure added address is still selected và đảm bảo địa chỉ mặc định được chọn
            const addedAddress = refreshedAddresses.find(addr => addr.id === newAddressWithId.id);
            if (addedAddress) {
              console.log('Confirming added address selection:', addedAddress.id);
              setSelectedAddressId(addedAddress.id);
              setShippingInfo({
                ...addedAddress
              });
            } else {
              // Nếu không tìm thấy address vừa add, chọn default
              const refreshedDefault = refreshedAddresses.find(addr => addr.isDefault);
              if (refreshedDefault) {
                console.log('Re-selecting default address after add:', refreshedDefault.id);
                setSelectedAddressId(refreshedDefault.id);
                setShippingInfo({
                  ...refreshedDefault
                });
              }
            }
          } catch (refreshError) {
            console.warn('Failed to refresh addresses after add:', refreshError);
          }
        }, 500);
        
        toast.success('Thêm địa chỉ thành công', {
          position: 'top-right',
          autoClose: 2000,
        });
        
    } catch (error) {
      console.error('Lỗi khi thêm địa chỉ:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast.error(error.response?.data?.message || error.message || 'Không thể thêm địa chỉ, vui lòng thử lại', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật địa chỉ
  const handleUpdateAddress = async (updatedAddress) => {
    if (!updatedAddress.id) {
      toast.error('Không tìm thấy ID địa chỉ để cập nhật!');
      return;
    }
    
    console.log('=== UPDATE ADDRESS DEBUG ===');
    console.log('Updating address:', updatedAddress);
    console.log('Current addresses before update:', addresses);
    
    try {
      // Log dữ liệu gửi đi
      console.log('Data being sent to server:', updatedAddress);
      
      const response = await axiosInstance.put(`/cart-checkout/address/${updatedAddress.id}`, updatedAddress);
      console.log('Update response from server:', response.data);
      
      // KIỂM TRA RESPONSE DATA
      let serverData = response.data;
      
      // Nếu server trả về mảng rỗng hoặc null, sử dụng dữ liệu từ request
      if (!serverData || Array.isArray(serverData) || Object.keys(serverData).length === 0) {
        console.warn('Server returned invalid data, using request data as fallback');
        serverData = {
          ...updatedAddress,
          id: updatedAddress.id,
          // Giữ một số thông tin từ địa chỉ cũ nếu cần
          createdAt: addresses.find(addr => addr.id === updatedAddress.id)?.createdAt,
          updatedAt: new Date().toISOString()
        };
        console.log('Using fallback data:', serverData);
      }
      
      // Cập nhật danh sách địa chỉ với dữ liệu đã được validate
      const newAddresses = addresses.map(addr => {
        if (addr.id === updatedAddress.id) {
          console.log(`Updating address ${addr.id} from:`, addr);
          console.log(`To:`, serverData);
          
          // Merge dữ liệu để đảm bảo không mất thông tin quan trọng
          const updatedAddr = { 
            ...addr, // Giữ dữ liệu cũ
            ...serverData, // Ghi đè với dữ liệu mới
            id: updatedAddress.id // Đảm bảo ID không thay đổi
          };
          console.log(`Final updated address:`, updatedAddr);
          return updatedAddr;
        }
        return addr;
      });
      
      console.log('New addresses after update:', newAddresses);
      setAddresses(newAddresses);
      setEditingAddress(null);        // REFETCH addresses từ server để đảm bảo đồng bộ
        setTimeout(async () => {
          try {
            const userId = await getAuthenticatedUserId();
            if (!userId) return;
            
            const refreshResponse = await axiosInstance.get(`/cart-checkout/address/${userId}`);
            const refreshedAddresses = Array.isArray(refreshResponse.data) ? refreshResponse.data : [];
            console.log('Refreshed addresses after update:', refreshedAddresses);
            setAddresses(refreshedAddresses);
            
            // Re-check địa chỉ mặc định sau khi refresh
            const refreshedDefault = refreshedAddresses.find(addr => addr.isDefault);
            if (refreshedDefault && !selectedAddressId) {
              setSelectedAddressId(refreshedDefault.id);
              setShippingInfo({
                ...refreshedDefault
              });
            }
          } catch (refreshError) {
            console.warn('Failed to refresh addresses after update:', refreshError);
          }
        }, 500);
      
      // Cập nhật shipping info nếu đây là địa chỉ đang được chọn
      if (selectedAddressId === updatedAddress.id) {
        const updatedAddressData = newAddresses.find(addr => addr.id === updatedAddress.id);
        if (updatedAddressData) {
          console.log('Updating shipping info with:', updatedAddressData);
          setShippingInfo({
            id: updatedAddressData.id,
            name: updatedAddressData.name,
            phoneNumber: updatedAddressData.phoneNumber,
            address: updatedAddressData.address,
            provinceName: updatedAddressData.provinceName,
            provinceId: updatedAddressData.provinceId,
            districtName: updatedAddressData.districtName,
            districtId: updatedAddressData.districtId,
            wardName: updatedAddressData.wardName,
            wardCode: updatedAddressData.wardCode
          });
        }
      }
      
      toast.success('Cập nhật địa chỉ thành công', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Lỗi khi cập nhật địa chỉ:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật địa chỉ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Xoá địa chỉ
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc muốn xoá địa chỉ này?')) return;
    
    console.log('=== DELETE ADDRESS DEBUG ===');
    console.log('Deleting addressId:', addressId);
    console.log('Current addresses before delete:', addresses);
    
    try {
      await axiosInstance.delete(`/cart-checkout/address/${addressId}`);
      
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      console.log('Updated addresses after delete:', updatedAddresses);
      
      setAddresses(updatedAddresses);        // REFETCH addresses từ server để đảm bảo đồng bộ
        setTimeout(async () => {
          try {
            const userId = await getAuthenticatedUserId();
            if (!userId) return;
            
            const refreshResponse = await axiosInstance.get(`/cart-checkout/address/${userId}`);
            const refreshedAddresses = Array.isArray(refreshResponse.data) ? refreshResponse.data : [];
            console.log('Refreshed addresses after delete:', refreshedAddresses);
            setAddresses(refreshedAddresses);
            
            // Re-check địa chỉ mặc định sau khi refresh và chọn lại nếu cần
            if (!selectedAddressId || selectedAddressId === addressId) {
              const refreshedDefault = refreshedAddresses.find(addr => addr.isDefault);
              if (refreshedDefault) {
                console.log('Re-selecting default address after delete:', refreshedDefault.id);
                setSelectedAddressId(refreshedDefault.id);
                setShippingInfo({
                  id: refreshedDefault.id,
                  name: refreshedDefault.name,
                  phoneNumber: refreshedDefault.phoneNumber,
                  address: refreshedDefault.address,
                  provinceName: refreshedDefault.provinceName,
                  provinceId: refreshedDefault.provinceId,
                  districtName: refreshedDefault.districtName,
                  districtId: refreshedDefault.districtId,
                  wardName: refreshedDefault.wardName,
                  wardCode: refreshedDefault.wardCode
                });
              }
            }
          } catch (refreshError) {
            console.warn('Failed to refresh addresses after delete:', refreshError);
          }
        }, 500);
      
      // Nếu địa chỉ đang được chọn bị xóa, clear selection
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
        setShippingInfo({});
        console.log('Cleared selected address and shipping info');
      }
      
      toast.success('Xoá địa chỉ thành công', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Lỗi khi xóa địa chỉ:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xoá địa chỉ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Đặt làm mặc định
  const handleSetDefault = async (addressId) => {
    if (!addressId) {
      toast.error('Không tìm thấy ID địa chỉ để đặt mặc định!');
      return;
    }
    
    console.log('=== SET DEFAULT ADDRESS DEBUG ===');
    console.log('Setting default for addressId:', addressId);
    console.log('Current addresses before set default:', addresses);
    
    try {
      const userId = await getAuthenticatedUserId();
      if (!userId) {
        toast.error('Vui lòng đăng nhập để thực hiện thao tác này', { position: 'top-right', autoClose: 3000 });
        return;
      }
      
      const response = await axiosInstance.put(`/cart-checkout/address/default/${userId}/${addressId}`);
      console.log('Set default response:', response.data);
      
      // Cập nhật lại danh sách một cách đơn giản và an toàn
      const updatedAddresses = addresses.map(addr => {
        const updatedAddr = { ...addr }; // Tạo bản sao để không thay đổi object gốc
        if (addr.id === addressId) {
          // Địa chỉ được đặt làm mặc định
          updatedAddr.isDefault = true;
          console.log(`Set address ${addr.id} as default`);
        } else {
          // Các địa chỉ khác không còn là mặc định
          updatedAddr.isDefault = false;
          console.log(`Remove default status from address ${addr.id}`);
        }
        return updatedAddr;
      });
      
      console.log('Updated addresses after set default:', updatedAddresses);
      setAddresses(updatedAddresses);
      setSelectedAddressId(addressId);
      
      // Tìm địa chỉ đã được cập nhật để set shipping info
      const selectedAddress = updatedAddresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        console.log('Setting shipping info for selected address:', selectedAddress);
        setShippingInfo({
          id: selectedAddress.id,
          name: selectedAddress.name,
          phoneNumber: selectedAddress.phoneNumber,
          address: selectedAddress.address,
          provinceName: selectedAddress.provinceName,
          provinceId: selectedAddress.provinceId,
          districtName: selectedAddress.districtName,
          districtId: selectedAddress.districtId,
          wardName: selectedAddress.wardName,
          wardCode: selectedAddress.wardCode
        });
      }
      toast.success('Đã đặt làm địa chỉ mặc định!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Error setting default address:', error);
      
      // Xử lý lỗi authentication
      if (error.message === 'Authentication required' || error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', {
          position: 'top-right',
          autoClose: 5000,
        });
        return;
      }
      
      toast.error(error.response?.data?.message || 'Lỗi khi đặt làm mặc định', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleNext = () => {
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn hoặc thêm địa chỉ giao hàng', { position: 'top-right', autoClose: 3000 });
      return;
    }
    setShippingInfo((prev) => ({ ...prev }));
    onNext();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Chọn Địa Chỉ Giao Hàng</h2>
      {isLoading ? (
        <div key="loading" className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
        </div>
      ) : editingAddress ? (
        <ShippingForm
          key="editing"
          shippingInfo={editingAddress}
          setShippingInfo={handleUpdateAddress}
          onCancel={() => setEditingAddress(null)}
          isEdit={true}
        />
      ) : isAddingNew ? (
        <ShippingForm
          key="adding"
          shippingInfo={{
            name: '',
            phoneNumber: '',
            address: '',
            provinceName: '',
            provinceId: '',
            districtName: '',
            districtId: '',
            wardName: '',
            wardCode: '',
            shippingFee: 22000,
            isDefault: false,
          }}
          setShippingInfo={handleAddNewAddress}
          onCancel={() => setIsAddingNew(false)}
        />
      ) : (
        <div key="address-list-container">
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p key="no-addresses" className="text-sm text-gray-500">Chưa có địa chỉ nào được lưu</p>
            ) : (
              addresses.map((address) => (
                <div key={`address-${address.id}`} className={`flex items-center p-4 bg-gray-50 rounded-lg transition duration-200 ${selectedAddressId === address.id ? 'border-2 border-indigo-600' : ''}`}>
                  <input
                    key={`radio-${address.id}`}
                    type="radio"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => {
                      setSelectedAddressId(address.id);
                      setShippingInfo({
                        id: address.id,
                        name: address.name,
                        phoneNumber: address.phoneNumber,
                        address: address.address,
                        provinceName: address.provinceName,
                        provinceId: address.provinceId,
                        districtName: address.districtName,
                        districtId: address.districtId,
                        wardName: address.wardName,
                        wardCode: address.wardCode
                      });
                    }}
                    className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div key={`info-${address.id}`} className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {address.name} {address.isDefault && <span key={`default-label-${address.id}`} className="text-xs text-indigo-600">(Mặc định)</span>}
                    </p>
                    <p key={`phone-${address.id}`} className="text-xs text-gray-500">{address.phoneNumber}</p>
                    <p key={`address-text-${address.id}`} className="text-xs text-gray-500">
                      {address.address}, {address.wardName}, {address.districtName}, {address.provinceName}
                    </p>
                  </div>
                  <button
                    key={`edit-btn-${address.id}`}
                    onClick={() => setEditingAddress(address)}
                    className="ml-4 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Cập nhật
                  </button>
                  <button
                    key={`delete-btn-${address.id}`}
                    onClick={() => handleDeleteAddress(address.id)}
                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Xoá địa chỉ"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                  {!address.isDefault && (
                    <button
                      key={`default-btn-${address.id}`}
                      onClick={() => handleSetDefault(address.id)}
                      className="ml-2 px-2 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-700"
                      title="Đặt làm mặc định"
                    >
                      Đặt mặc định
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {addresses.length >= 4 ? (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Bạn đã đạt giới hạn tối đa 4 địa chỉ giao hàng. Vui lòng xóa một địa chỉ cũ để thêm địa chỉ mới.
              </p>
            </div>
          ) : (
            <button
              key="add-new-btn"
              onClick={() => setIsAddingNew(true)}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
            >
              Thêm địa chỉ mới ({addresses.length}/4)
            </button>
          )}
          {selectedAddressId && (
            <button
              key="continue-btn"
              onClick={handleNext}
              className="mt-4 ml-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
            >
              Tiếp tục
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressSelector;