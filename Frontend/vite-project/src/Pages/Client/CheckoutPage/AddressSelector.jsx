import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import ShippingForm from './ShippingForm';
import { HiOutlineTrash } from 'react-icons/hi';

const AddressSelector = ({ selectedAddressId, setSelectedAddressId, setShippingInfo, onNext }) => {
  const [addresses, setAddresses] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // Địa chỉ đang sửa

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Vui lòng đăng nhập để xem địa chỉ', { position: 'top-right', autoClose: 3000 });
          return;
        }
        const response = await axiosInstance.get(`/customer-information/user/${userId}`);
        setAddresses(response.data || []);
        // Tự động chọn địa chỉ mặc định nếu có
        const defaultAddress = response.data.find((addr) => addr.isDefault);
        if (defaultAddress && !selectedAddressId) {
          setSelectedAddressId(defaultAddress.id);
          setShippingInfo({
            id: defaultAddress.id,
            name: defaultAddress.name,
            phoneNumber: defaultAddress.phoneNumber,
            address: defaultAddress.address,
            provinceName: defaultAddress.provinceName,
            provinceId: defaultAddress.provinceId,
            districtName: defaultAddress.districtName,
            districtId: defaultAddress.districtId,
            wardName: defaultAddress.wardName,
            wardCode: defaultAddress.wardCode,
            shippingFee: 22000, // Fixed shipping fee
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi lấy danh sách địa chỉ', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddresses();
  }, [setSelectedAddressId, setShippingInfo]);

  // Thêm địa chỉ mới
  const handleAddNewAddress = async (newAddress) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axiosInstance.post(`/cart-checkout/address/add?userId=${userId}`, {
        name: newAddress.name,
        phoneNumber: newAddress.phoneNumber,
        address: newAddress.address,
        provinceId: newAddress.provinceId,
        provinceName: newAddress.provinceName,
        districtId: newAddress.districtId,
        districtName: newAddress.districtName,
        wardCode: newAddress.wardCode,
        wardName: newAddress.wardName,
        isDefault: addresses.length === 0, // Set as default if it's the first address
      });
      setAddresses([response.data, ...addresses]); // Thêm vào đầu danh sách
      setSelectedAddressId(response.data.id);
      setShippingInfo({
        id: response.data.id,
        name: response.data.name,
        phoneNumber: response.data.phoneNumber,
        address: response.data.address,
        provinceName: response.data.provinceName,
        provinceId: response.data.provinceId,
        districtName: response.data.districtName,
        districtId: response.data.districtId,
        wardName: response.data.wardName,
        wardCode: response.data.wardCode,
        shippingFee: 22000, // Fixed shipping fee
      });
      setIsAddingNew(false);
      toast.success('Thêm địa chỉ thành công', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm địa chỉ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Cập nhật địa chỉ
  const handleUpdateAddress = async (updatedAddress) => {
    if (!updatedAddress.id) {
      toast.error('Không tìm thấy ID địa chỉ để cập nhật!');
      return;
    }
    try {
      const response = await axiosInstance.put(`/cart-checkout/address/update/${updatedAddress.id}`, updatedAddress);
      let newAddresses = addresses.map(addr => addr.id === updatedAddress.id ? response.data : addr);
      // Nếu là mặc định, sắp xếp lên đầu
      if (response.data.isDefault) {
        newAddresses = [response.data, ...newAddresses.filter(addr => addr.id !== response.data.id)];
      }
      setAddresses(newAddresses);
      setEditingAddress(null);
      toast.success('Cập nhật địa chỉ thành công', { position: 'top-right', autoClose: 3000 });
      setSelectedAddressId(response.data.id);
      setShippingInfo({
        id: response.data.id,
        name: response.data.name,
        phoneNumber: response.data.phoneNumber,
        address: response.data.address,
        provinceName: response.data.provinceName,
        provinceId: response.data.provinceId,
        districtName: response.data.districtName,
        districtId: response.data.districtId,
        wardName: response.data.wardName,
        wardCode: response.data.wardCode,
        shippingFee: 22000,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật địa chỉ', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Xoá địa chỉ
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc muốn xoá địa chỉ này?')) return;
    try {
      await axiosInstance.delete(`/cart-checkout/address/delete/${addressId}`);
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      if (selectedAddressId === addressId) {
        setSelectedAddressId(null);
        setShippingInfo({});
      }
      toast.success('Xoá địa chỉ thành công', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
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
    try {
      const userId = localStorage.getItem('userId');
      const response = await axiosInstance.put(`/cart-checkout/address/set-default/${addressId}?userId=${userId}`);
      // Cập nhật lại danh sách, đưa địa chỉ mặc định lên đầu
      let newAddresses = addresses.map(addr => addr.id === addressId ? response.data : { ...addr, isDefault: false });
      newAddresses = [response.data, ...newAddresses.filter(addr => addr.id !== addressId)];
      setAddresses(newAddresses);
      setSelectedAddressId(addressId);
      setShippingInfo({
        id: response.data.id,
        name: response.data.name,
        phoneNumber: response.data.phoneNumber,
        address: response.data.address,
        provinceName: response.data.provinceName,
        provinceId: response.data.provinceId,
        districtName: response.data.districtName,
        districtId: response.data.districtId,
        wardName: response.data.wardName,
        wardCode: response.data.wardCode,
        shippingFee: 22000,
      });
      toast.success('Đã đặt làm địa chỉ mặc định!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
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
    setShippingInfo((prev) => ({ ...prev, shippingFee: 22000 }));
    onNext();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Chọn Địa Chỉ Giao Hàng</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
        </div>
      ) : editingAddress ? (
        <ShippingForm
          shippingInfo={editingAddress}
          setShippingInfo={handleUpdateAddress}
          onCancel={() => setEditingAddress(null)}
          isEdit={true}
        />
      ) : isAddingNew ? (
        <ShippingForm
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
        <>
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có địa chỉ nào được lưu</p>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className={`flex items-center p-4 bg-gray-50 rounded-lg transition duration-200 ${selectedAddressId === address.id ? 'border-2 border-indigo-600' : ''}`}>
                  <input
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
                        wardCode: address.wardCode,
                        shippingFee: 22000,
                      });
                    }}
                    className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {address.name} {address.isDefault && <span className="text-xs text-indigo-600">(Mặc định)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{address.phoneNumber}</p>
                    <p className="text-xs text-gray-500">
                      {address.address}, {address.wardName}, {address.districtName}, {address.provinceName}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingAddress(address)}
                    className="ml-4 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Cập nhật
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Xoá địa chỉ"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                  {!address.isDefault && (
                    <button
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
          <button
            onClick={() => setIsAddingNew(true)}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            Thêm địa chỉ mới
          </button>
          {selectedAddressId && (
            <button
              onClick={handleNext}
              className="mt-4 ml-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
            >
              Tiếp tục
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AddressSelector;