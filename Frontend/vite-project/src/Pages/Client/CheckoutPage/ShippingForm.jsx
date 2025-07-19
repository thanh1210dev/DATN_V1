import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';

const ShippingForm = ({ shippingInfo, setShippingInfo, onCancel, isEdit }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: shippingInfo.name || '',
    phoneNumber: shippingInfo.phoneNumber || '',
    address: shippingInfo.address || '',
    provinceName: shippingInfo.provinceName || '',
    provinceId: shippingInfo.provinceId || '',
    districtName: shippingInfo.districtName || '',
    districtId: shippingInfo.districtId || '',
    wardName: shippingInfo.wardName || '',
    wardCode: shippingInfo.wardCode || '',
    shippingFee: 22000, // Fixed shipping fee
    isDefault: shippingInfo.isDefault || false,
  });

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/ghn-address/provinces');
        setProvinces(response.data.data || []);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (formData.provinceId) {
        try {
          setIsLoading(true);
          const response = await axiosInstance.get(`/ghn-address/districts?provinceId=${formData.provinceId}`);
          setDistricts(response.data.data || []);
          setWards([]);
          setFormData({ ...formData, districtId: '', districtName: '', wardCode: '', wardName: '' });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchDistricts();
  }, [formData.provinceId]);

  useEffect(() => {
    const fetchWards = async () => {
      if (formData.districtId) {
        try {
          setIsLoading(true);
          const response = await axiosInstance.get(`/ghn-address/wards?districtId=${formData.districtId}`);
          setWards(response.data.data || []);
          setFormData({ ...formData, wardCode: '', wardName: '' });
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchWards();
  }, [formData.districtId]);

  const handleSubmit = () => {
    if (!formData.name || !formData.phoneNumber || !formData.address || !formData.provinceId || !formData.districtId || !formData.wardCode) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng', { position: 'top-right', autoClose: 3000 });
      return;
    }
    setShippingInfo(formData);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông Tin Giao Hàng</h2>
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Họ và Tên</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nhập họ và tên"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Số Điện Thoại</label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tỉnh/Thành Phố</label>
          <select
            value={formData.provinceId}
            onChange={(e) => {
              const selectedProvince = provinces.find((p) => p.ProvinceID === parseInt(e.target.value));
              setFormData({
                ...formData,
                provinceId: e.target.value,
                provinceName: selectedProvince ? selectedProvince.ProvinceName : '',
              });
            }}
            className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Chọn tỉnh/thành phố</option>
            {provinces.map((province) => (
              <option key={province.ProvinceID} value={province.ProvinceID}>
                {province.ProvinceName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quận/Huyện</label>
          <select
            value={formData.districtId}
            onChange={(e) => {
              const selectedDistrict = districts.find((d) => d.DistrictID === parseInt(e.target.value));
              setFormData({
                ...formData,
                districtId: e.target.value,
                districtName: selectedDistrict ? selectedDistrict.DistrictName : '',
              });
            }}
            className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!formData.provinceId}
          >
            <option value="">Chọn quận/huyện</option>
            {districts.map((district) => (
              <option key={district.DistrictID} value={district.DistrictID}>
                {district.DistrictName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phường/Xã</label>
          <select
            value={formData.wardCode}
            onChange={(e) => {
              const selectedWard = wards.find((w) => w.WardCode === e.target.value);
              setFormData({
                ...formData,
                wardCode: e.target.value,
                wardName: selectedWard ? selectedWard.WardName : '',
              });
            }}
            className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!formData.districtId}
          >
            <option value="">Chọn phường/xã</option>
            {wards.map((ward) => (
              <option key={ward.WardCode} value={ward.WardCode}>
                {ward.WardName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Địa Chỉ Chi Tiết</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Nhập địa chỉ chi tiết"
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đặt làm địa chỉ mặc định?</label>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.isDefault === true}
                  onChange={() => setFormData({ ...formData, isDefault: true })}
                />
                Có
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.isDefault === false}
                  onChange={() => setFormData({ ...formData, isDefault: false })}
                />
                Không
              </label>
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
          >
            {isEdit ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition duration-300"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingForm;