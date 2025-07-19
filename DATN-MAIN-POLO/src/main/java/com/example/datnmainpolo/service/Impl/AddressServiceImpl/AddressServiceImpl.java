package com.example.datnmainpolo.service.Impl.AddressServiceImpl;

import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationOnlineRequestDTO;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.repository.CustomerInformationRepository;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AddressServiceImpl.class);

    private final CustomerInformationRepository customerInformationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    @Value("${ghn.api.token}")
    private String ghnToken;
    @Value("${ghn.api.base-url}")
    private String ghnBaseUrl;

    @Override
    @Transactional
    public CustomerInformation addAddress(Integer userId, CustomerInformationOnlineRequestDTO addressDTO) {
        LOGGER.info("Adding new address for user {}", userId);

        // Validate dữ liệu đầu vào
        if (addressDTO.getName() == null || addressDTO.getName().trim().isEmpty())
            throw new RuntimeException("Tên người nhận không được để trống");
        if (addressDTO.getPhoneNumber() == null || addressDTO.getPhoneNumber().trim().isEmpty())
            throw new RuntimeException("Số điện thoại không được để trống");
        if (addressDTO.getAddress() == null || addressDTO.getAddress().trim().isEmpty())
            throw new RuntimeException("Địa chỉ chi tiết không được để trống");
        if (addressDTO.getProvinceId() == null)
            throw new RuntimeException("Tỉnh/Thành phố không được để trống");
        if (addressDTO.getDistrictId() == null)
            throw new RuntimeException("Quận/Huyện không được để trống");
        if (addressDTO.getWardCode() == null || addressDTO.getWardCode().trim().isEmpty())
            throw new RuntimeException("Phường/Xã không được để trống");

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Đồng bộ tên địa chỉ với GHN nếu thiếu hoặc sai
        String provinceName = addressDTO.getProvinceName();
        String districtName = addressDTO.getDistrictName();
        String wardName = addressDTO.getWardName();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            // Lấy tên phường/xã
            if (wardName == null || wardName.trim().isEmpty()) {
                String wardUrl = ghnBaseUrl + "/master-data/ward?district_id=" + addressDTO.getDistrictId();
                HttpEntity<String> wardRequest = new HttpEntity<>(headers);
                ResponseEntity<java.util.Map> wardResponse = restTemplate.exchange(wardUrl, HttpMethod.GET, wardRequest, java.util.Map.class);
                java.util.Map wardResponseBody = wardResponse.getBody();
                if (wardResponseBody != null && wardResponseBody.containsKey("data")) {
                    java.util.List<java.util.Map<String, Object>> wardDataList = (java.util.List<java.util.Map<String, Object>>) wardResponseBody.get("data");
                    for (java.util.Map<String, Object> wardData : wardDataList) {
                        String code = (String) wardData.get("WardCode");
                        if (code != null && code.equals(addressDTO.getWardCode())) {
                            wardName = (String) wardData.get("WardName");
                            break;
                        }
                    }
                }
            }
            // Lấy tên quận/huyện
            if (districtName == null || districtName.trim().isEmpty()) {
                String districtUrl = ghnBaseUrl + "/master-data/district?district_id=" + addressDTO.getDistrictId();
                HttpEntity<String> districtRequest = new HttpEntity<>(headers);
                ResponseEntity<java.util.Map> districtResponse = restTemplate.exchange(districtUrl, HttpMethod.GET, districtRequest, java.util.Map.class);
                java.util.Map districtResponseBody = districtResponse.getBody();
                if (districtResponseBody != null && districtResponseBody.containsKey("data")) {
                    java.util.List<java.util.Map<String, Object>> districtDataList = (java.util.List<java.util.Map<String, Object>>) districtResponseBody.get("data");
                    if (!districtDataList.isEmpty()) {
                        java.util.Map<String, Object> districtData = districtDataList.get(0);
                        districtName = (String) districtData.get("DistrictName");
                    }
                }
            }
            // Lấy tên tỉnh/thành
            if (provinceName == null || provinceName.trim().isEmpty()) {
                String provinceUrl = ghnBaseUrl + "/master-data/province?province_id=" + addressDTO.getProvinceId();
                HttpEntity<String> provinceRequest = new HttpEntity<>(headers);
                ResponseEntity<java.util.Map> provinceResponse = restTemplate.exchange(provinceUrl, HttpMethod.GET, provinceRequest, java.util.Map.class);
                java.util.Map provinceResponseBody = provinceResponse.getBody();
                if (provinceResponseBody != null && provinceResponseBody.containsKey("data")) {
                    java.util.List<java.util.Map<String, Object>> provinceDataList = (java.util.List<java.util.Map<String, Object>>) provinceResponseBody.get("data");
                    if (!provinceDataList.isEmpty()) {
                        java.util.Map<String, Object> provinceData = provinceDataList.get(0);
                        provinceName = (String) provinceData.get("ProvinceName");
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error("Lỗi khi đồng bộ tên địa chỉ với GHN: {}", e.getMessage());
        }

        CustomerInformation address = new CustomerInformation();
        address.setName(addressDTO.getName());
        address.setPhoneNumber(addressDTO.getPhoneNumber());
        address.setAddress(addressDTO.getAddress());
        address.setProvinceName(provinceName);
        address.setProvinceId(addressDTO.getProvinceId());
        address.setDistrictName(districtName);
        address.setDistrictId(addressDTO.getDistrictId());
        address.setWardName(wardName);
        address.setWardCode(addressDTO.getWardCode());
        address.setCustomer(user);
        address.setCreatedAt(Instant.now());
        address.setUpdatedAt(Instant.now());
        address.setDeleted(false);

        // Nếu là địa chỉ mặc định hoặc là địa chỉ đầu tiên
        if (Boolean.TRUE.equals(addressDTO.getIsDefault()) ||
            customerInformationRepository.countByCustomerIdAndDeletedFalse(userId) == 0) {
            unsetOtherDefaultAddresses(userId);
            address.setIsDefault(true);
        } else {
            address.setIsDefault(false);
        }

        return customerInformationRepository.save(address);
    }

    @Override
    @Transactional
    public CustomerInformation updateAddress(Integer addressId, CustomerInformationOnlineRequestDTO addressDTO) {
        LOGGER.info("Updating address {}", addressId);

        // Validate dữ liệu đầu vào
        if (addressDTO.getName() == null || addressDTO.getName().trim().isEmpty())
            throw new RuntimeException("Tên người nhận không được để trống");
        if (addressDTO.getPhoneNumber() == null || addressDTO.getPhoneNumber().trim().isEmpty())
            throw new RuntimeException("Số điện thoại không được để trống");
        if (addressDTO.getAddress() == null || addressDTO.getAddress().trim().isEmpty())
            throw new RuntimeException("Địa chỉ chi tiết không được để trống");
        if (addressDTO.getProvinceId() == null)
            throw new RuntimeException("Tỉnh/Thành phố không được để trống");
        if (addressDTO.getDistrictId() == null)
            throw new RuntimeException("Quận/Huyện không được để trống");
        if (addressDTO.getWardCode() == null || addressDTO.getWardCode().trim().isEmpty())
            throw new RuntimeException("Phường/Xã không được để trống");

        CustomerInformation address = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

        // Đồng bộ tên địa chỉ với GHN nếu thiếu hoặc sai
        String provinceName = addressDTO.getProvinceName();
        String districtName = addressDTO.getDistrictName();
        String wardName = addressDTO.getWardName();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            // Lấy tên phường/xã
            if (wardName == null || wardName.trim().isEmpty()) {
                String wardUrl = ghnBaseUrl + "/master-data/ward?district_id=" + addressDTO.getDistrictId();
                HttpEntity<String> wardRequest = new HttpEntity<>(headers);
                ResponseEntity<java.util.Map> wardResponse = restTemplate.exchange(wardUrl, HttpMethod.GET, wardRequest, java.util.Map.class);
                java.util.Map wardResponseBody = wardResponse.getBody();
                if (wardResponseBody != null && wardResponseBody.containsKey("data")) {
                    java.util.List<java.util.Map<String, Object>> wardDataList = (java.util.List<java.util.Map<String, Object>>) wardResponseBody.get("data");
                    for (java.util.Map<String, Object> wardData : wardDataList) {
                        String code = (String) wardData.get("WardCode");
                        if (code != null && code.equals(addressDTO.getWardCode())) {
                            wardName = (String) wardData.get("WardName");
                            break;
                        }
                    }
                }
            }
            // Lấy tên quận/huyện
            if (districtName == null || districtName.trim().isEmpty()) {
                String districtUrl = ghnBaseUrl + "/master-data/district?district_id=" + addressDTO.getDistrictId();
                HttpEntity<String> districtRequest = new HttpEntity<>(headers);
                ResponseEntity<java.util.Map> districtResponse = restTemplate.exchange(districtUrl, HttpMethod.GET, districtRequest, java.util.Map.class);
                java.util.Map districtResponseBody = districtResponse.getBody();
                if (districtResponseBody != null && districtResponseBody.containsKey("data")) {
                    java.util.List<java.util.Map<String, Object>> districtDataList = (java.util.List<java.util.Map<String, Object>>) districtResponseBody.get("data");
                    if (!districtDataList.isEmpty()) {
                        java.util.Map<String, Object> districtData = districtDataList.get(0);
                        districtName = (String) districtData.get("DistrictName");
                    }
                }
            }
            // Lấy tên tỉnh/thành
            if (provinceName == null || provinceName.trim().isEmpty()) {
                String provinceUrl = ghnBaseUrl + "/master-data/province?province_id=" + addressDTO.getProvinceId();
                HttpEntity<String> provinceRequest = new HttpEntity<>(headers);
                ResponseEntity<java.util.Map> provinceResponse = restTemplate.exchange(provinceUrl, HttpMethod.GET, provinceRequest, java.util.Map.class);
                java.util.Map provinceResponseBody = provinceResponse.getBody();
                if (provinceResponseBody != null && provinceResponseBody.containsKey("data")) {
                    java.util.List<java.util.Map<String, Object>> provinceDataList = (java.util.List<java.util.Map<String, Object>>) provinceResponseBody.get("data");
                    if (!provinceDataList.isEmpty()) {
                        java.util.Map<String, Object> provinceData = provinceDataList.get(0);
                        provinceName = (String) provinceData.get("ProvinceName");
                    }
                }
            }
        } catch (Exception e) {
            LOGGER.error("Lỗi khi đồng bộ tên địa chỉ với GHN: {}", e.getMessage());
        }

        address.setName(addressDTO.getName());
        address.setPhoneNumber(addressDTO.getPhoneNumber());
        address.setAddress(addressDTO.getAddress());
        address.setProvinceName(provinceName);
        address.setProvinceId(addressDTO.getProvinceId());
        address.setDistrictName(districtName);
        address.setDistrictId(addressDTO.getDistrictId());
        address.setWardName(wardName);
        address.setWardCode(addressDTO.getWardCode());
        address.setUpdatedAt(Instant.now());

        if (Boolean.TRUE.equals(addressDTO.getIsDefault())) {
            unsetOtherDefaultAddresses(address.getCustomer().getId());
            address.setIsDefault(true);
        }

        return customerInformationRepository.save(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Integer addressId) {
        LOGGER.info("Deleting address {}", addressId);

        CustomerInformation address = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

        address.setDeleted(true);
        address.setUpdatedAt(Instant.now());
        customerInformationRepository.save(address);
    }

    @Override
    public List<CustomerInformation> getUserAddresses(Integer userId) {
        LOGGER.debug("Fetching addresses for user {}", userId);
        return customerInformationRepository.findByCustomerIdAndDeletedFalse(userId);
    }

    @Override
    @Transactional
    public CustomerInformation setDefaultAddress(Integer userId, Integer addressId) {
        LOGGER.info("Setting default address {} for user {}", addressId, userId);

        CustomerInformation address = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

        if (!address.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Địa chỉ không thuộc về người dùng này");
        }

        unsetOtherDefaultAddresses(userId);
        address.setIsDefault(true);
        address.setUpdatedAt(Instant.now());
        return customerInformationRepository.save(address);
    }

    private void unsetOtherDefaultAddresses(Integer userId) {
        List<CustomerInformation> addresses = customerInformationRepository.findByCustomerIdAndIsDefaultTrueAndDeletedFalse(userId);
        for (CustomerInformation addr : addresses) {
            addr.setIsDefault(false);
            customerInformationRepository.save(addr);
        }
    }
}