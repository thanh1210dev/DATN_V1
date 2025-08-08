import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Service/axiosInstance';

const ShippingForm = ({ shippingInfo, setShippingInfo, onCancel, isEdit }) => {
  // Debug log để kiểm tra dữ liệu truyền vào
  useEffect(() => {
    console.log('=== SHIPPING FORM DEBUG ===');
    console.log('isEdit:', isEdit);
    console.log('shippingInfo:', shippingInfo);
    console.log('shippingInfo.id:', shippingInfo.id);
  }, [isEdit, shippingInfo]);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: shippingInfo.id || null, // Thêm ID để cập nhật
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
    // CHỈ SET DEFAULT CHO ĐỊA CHỈ MỚI, KHÔNG TỰ ĐỘNG SET CHO UPDATE
    isDefault: isEdit ? (shippingInfo.isDefault || false) : false,
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
          
          // Chỉ reset district và ward nếu KHÔNG phải đang edit hoặc provinceId thay đổi
          if (!isEdit || !shippingInfo.districtId) {
            setWards([]);
            setFormData(prev => ({ ...prev, districtId: '', districtName: '', wardCode: '', wardName: '' }));
          }
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
          
          // Chỉ reset ward nếu KHÔNG phải đang edit hoặc districtId thay đổi
          if (!isEdit || !shippingInfo.wardCode) {
            setFormData(prev => ({ ...prev, wardCode: '', wardName: '' }));
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchWards();
  }, [formData.districtId]);

  // Load districts và wards khi edit và có dữ liệu sẵn
  useEffect(() => {
    const loadEditData = async () => {
      if (isEdit && shippingInfo.provinceId && shippingInfo.districtId) {
        try {
          setIsLoading(true);
          
          // Load districts
          const districtResponse = await axiosInstance.get(`/ghn-address/districts?provinceId=${shippingInfo.provinceId}`);
          setDistricts(districtResponse.data.data || []);
          
          // Load wards nếu có districtId
          if (shippingInfo.districtId) {
            const wardResponse = await axiosInstance.get(`/ghn-address/wards?districtId=${shippingInfo.districtId}`);
            setWards(wardResponse.data.data || []);
          }
        } catch (error) {
          console.error('Lỗi khi load dữ liệu edit:', error);
          toast.error('Lỗi khi tải dữ liệu địa chỉ');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadEditData();
  }, [isEdit, shippingInfo.provinceId, shippingInfo.districtId]);

  const validatePhoneNumber = (phone) => {
    // Kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = () => {
    console.log('=== SUBMIT DEBUG ===');
    console.log('isEdit:', isEdit);
    console.log('formData being submitted:', formData);
    console.log('formData.id:', formData.id);
    console.log('formData.isDefault:', formData.isDefault);
    
    if (!formData.name || !formData.phoneNumber || !formData.address || !formData.provinceId || !formData.districtId || !formData.wardCode) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng', { position: 'top-right', autoClose: 3000 });
      return;
    }

    // Validate số điện thoại
    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast.error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 0)', { position: 'top-right', autoClose: 5000 });
      return;
    }
    
    if (isEdit && !formData.id) {
      toast.error('Không tìm thấy ID địa chỉ để cập nhật!');
      console.error('Missing ID for edit operation');
      return;
    }
    
    // Tạo địa chỉ chi tiết đầy đủ (địa chỉ chi tiết + phường + quận + tỉnh)
    const fullAddress = `${formData.address}, ${formData.wardName}, ${formData.districtName}, ${formData.provinceName}`;
    
    // Tạo data để gửi
    const dataToSubmit = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      address: fullAddress, // Địa chỉ đầy đủ
      provinceId: formData.provinceId,
      provinceName: formData.provinceName,
      districtId: formData.districtId,
      districtName: formData.districtName,
      wardCode: formData.wardCode,
      wardName: formData.wardName,
      // ❌ LOẠI BỎ isDefault khỏi update - chỉ gửi khi thêm mới
      ...(isEdit ? { id: formData.id } : { isDefault: formData.isDefault || false })
    };
    
    console.log('Final data to submit (with full address):', dataToSubmit);
    setShippingInfo(dataToSubmit);
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
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Chỉ cho phép số
              if (value.length <= 10) {
                setFormData({ ...formData, phoneNumber: value });
              }
            }}
            className={`mt-1 w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-indigo-500'
            }`}
            placeholder="Nhập số điện thoại (10 số)"
            maxLength="10"
          />
          {formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber) && (
            <p className="mt-1 text-sm text-red-600">
              Số điện thoại không hợp lệ (phải có 10 số, bắt đầu bằng 03, 05, 07, 08, 09)
            </p>
          )}
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
        {/* ❌ LOẠI BỎ phần "Đặt làm địa chỉ mặc định" khỏi form update */}
        {/* Logic set mặc định sẽ được tách riêng thành nút riêng */}
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