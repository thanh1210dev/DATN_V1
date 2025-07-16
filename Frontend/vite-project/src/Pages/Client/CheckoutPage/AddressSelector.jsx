import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';
import ShippingForm from './ShippingForm';

const AddressSelector = ({ selectedAddressId, setSelectedAddressId, setShippingInfo, onNext }) => {
  const [addresses, setAddresses] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        // Automatically select the default address if available
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

  const handleAddNewAddress = async (newAddress) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await axiosInstance.post(`/customer-information?userId=${userId}`, {
        ...newAddress,
        isDefault: addresses.length === 0, // Set as default if it's the first address
      });
      setAddresses([...addresses, response.data]);
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
      ) : (
        <>
          {!isAddingNew ? (
            <>
              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có địa chỉ nào được lưu</p>
                ) : (
                  addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition duration-200 ${
                        selectedAddressId === address.id ? 'border-2 border-indigo-600' : ''
                      }`}
                    >
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
                            shippingFee: 22000, // Fixed shipping fee
                          });
                        }}
                        className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {address.name} {address.isDefault && <span className="text-xs text-indigo-600">(Mặc định)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{address.phoneNumber}</p>
                        <p className="text-xs text-gray-500">
                          {address.address}, {address.wardName}, {address.districtName}, {address.provinceName}
                        </p>
                      </div>
                    </label>
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
          ) : (
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
                shippingFee: 22000, // Fixed shipping fee
              }}
              setShippingInfo={handleAddNewAddress}
              onCancel={() => setIsAddingNew(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AddressSelector;