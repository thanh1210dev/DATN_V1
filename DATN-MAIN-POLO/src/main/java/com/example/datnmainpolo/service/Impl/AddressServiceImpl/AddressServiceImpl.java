package com.example.datnmainpolo.service.Impl.AddressServiceImpl;

import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.repository.CustomerInformationRepository;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    @Override
    @Transactional
    public CustomerInformation addAddress(Integer userId, CustomerInformationRequestDTO addressDTO) {
        LOGGER.info("Adding new address for user {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        CustomerInformation address = new CustomerInformation();
        address.setName(addressDTO.getName());
        address.setPhoneNumber(addressDTO.getPhoneNumber());
        address.setAddress(addressDTO.getAddress());
        address.setProvinceName(addressDTO.getProvinceName());
        address.setProvinceId(addressDTO.getProvinceId());
        address.setDistrictName(addressDTO.getDistrictName());
        address.setDistrictId(addressDTO.getDistrictId());
        address.setWardName(addressDTO.getWardName());
        address.setWardCode(addressDTO.getWardCode());
        address.setCustomer(user);
        address.setCreatedAt(Instant.now());
        address.setUpdatedAt(Instant.now());
        address.setDeleted(false);

        // If this is marked as default, unset other default addresses
        if (Boolean.TRUE.equals(addressDTO.getIsDefault())) {
            unsetOtherDefaultAddresses(userId);
            address.setIsDefault(true);
        } else if (customerInformationRepository.countByCustomerIdAndDeletedFalse(userId) == 0) {
            // If this is the first address, set it as default
            address.setIsDefault(true);
        }

        return customerInformationRepository.save(address);
    }

    @Override
    @Transactional
    public CustomerInformation updateAddress(Integer addressId, CustomerInformationRequestDTO addressDTO) {
        LOGGER.info("Updating address {}", addressId);

        CustomerInformation address = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

        address.setName(addressDTO.getName());
        address.setPhoneNumber(addressDTO.getPhoneNumber());
        address.setAddress(addressDTO.getAddress());
        address.setProvinceName(addressDTO.getProvinceName());
        address.setProvinceId(addressDTO.getProvinceId());
        address.setDistrictName(addressDTO.getDistrictName());
        address.setDistrictId(addressDTO.getDistrictId());
        address.setWardName(addressDTO.getWardName());
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