package com.example.datnmainpolo.service.Impl.CustomerInformationImpl;

import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationResponseDTO;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.repository.CustomerInformationRepository;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.CustomerInformationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerInformationImpl implements CustomerInformationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CustomerInformationImpl.class);
    private final CustomerInformationRepository customerInformationRepository;
    private final UserRepository userRepository;

    @Override
    public List<CustomerInformationResponseDTO> getAddressesByUserId(Integer userId) {
        LOGGER.info("Fetching addresses for user {}", userId);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        List<CustomerInformation> addresses = customerInformationRepository.findByCustomerIdAndDeletedFalse(userId);
        return addresses.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerInformationResponseDTO getDefaultAddressByUserId(Integer userId) {
        LOGGER.info("Fetching default address for user {}", userId);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        List<CustomerInformation> defaultAddresses = customerInformationRepository
                .findByCustomerIdAndIsDefaultTrueAndDeletedFalse(userId);
        if (defaultAddresses.isEmpty()) {
            throw new EntityNotFoundException("Không tìm thấy địa chỉ mặc định cho người dùng với ID: " + userId);
        }
        return toResponse(defaultAddresses.get(0));
    }

    @Override
    public CustomerInformationResponseDTO setDefaultAddress(Integer userId, Integer addressId) {
        LOGGER.info("Setting default address with ID {} for user {}", addressId, userId);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        CustomerInformation newDefaultAddress = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa chỉ với ID: " + addressId));

        if (newDefaultAddress.getDeleted()) {
            throw new IllegalStateException("Địa chỉ đã bị xóa");
        }

        if (!newDefaultAddress.getCustomer().getId().equals(userId)) {
            throw new IllegalStateException("Địa chỉ không thuộc về người dùng này");
        }

        // Unset default for all other addresses
        List<CustomerInformation> existingAddresses = customerInformationRepository
                .findByCustomerIdAndDeletedFalse(userId);
        existingAddresses.forEach(addr -> {
            if (!addr.getId().equals(addressId) && addr.getIsDefault()) {
                addr.setIsDefault(false);
                addr.setUpdatedAt(Instant.now());
                customerInformationRepository.save(addr);
            }
        });

        // Set new default address
        newDefaultAddress.setIsDefault(true);
        newDefaultAddress.setUpdatedAt(Instant.now());
        CustomerInformation savedEntity = customerInformationRepository.save(newDefaultAddress);
        return toResponse(savedEntity);
    }

    @Override
    public CustomerInformationResponseDTO saveAddress(CustomerInformationRequestDTO requestDTO, Integer userId) {
        LOGGER.info("Saving new address for user {}", userId);
        validateCustomerInformation(requestDTO);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        // Kiểm tra giới hạn 4 địa chỉ
        List<CustomerInformation> existingAddresses = customerInformationRepository.findByCustomerIdAndDeletedFalse(userId);
        if (existingAddresses.size() >= 4) {
            throw new IllegalStateException("Bạn chỉ được phép tạo tối đa 4 địa chỉ giao hàng");
        }

        CustomerInformation entity = new CustomerInformation();
        mapToEntity(entity, requestDTO);
        entity.setCustomer(user);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);

        // Set as default if it's the first address or explicitly requested
        if (existingAddresses.isEmpty() || (requestDTO.getIsDefault() != null && requestDTO.getIsDefault())) {
            entity.setIsDefault(true);
            // Unset default for other addresses
            existingAddresses.forEach(addr -> {
                if (addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    customerInformationRepository.save(addr);
                }
            });
        } else if (requestDTO.getIsDefault() == null) {
            entity.setIsDefault(false);
        }

        CustomerInformation savedEntity = customerInformationRepository.save(entity);
        return toResponse(savedEntity);
    }

    @Override
    public CustomerInformationResponseDTO updateAddress(Integer id, CustomerInformationRequestDTO requestDTO) {
        LOGGER.info("Updating address with ID {}", id);
        validateCustomerInformation(requestDTO);
        CustomerInformation entity = customerInformationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa chỉ với ID: " + id));

        if (entity.getDeleted()) {
            throw new IllegalStateException("Địa chỉ đã bị xóa");
        }

        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());

        // Handle default address logic
        if (requestDTO.getIsDefault() != null && requestDTO.getIsDefault()) {
            List<CustomerInformation> existingAddresses = customerInformationRepository.findByCustomerIdAndDeletedFalse(entity.getCustomer().getId());
            existingAddresses.forEach(addr -> {
                if (!addr.getId().equals(id) && addr.getIsDefault()) {
                    addr.setIsDefault(false);
                    customerInformationRepository.save(addr);
                }
            });
        }

        CustomerInformation savedEntity = customerInformationRepository.save(entity);
        return toResponse(savedEntity);
    }

    @Override
    public void softDelete(Integer id) {
        LOGGER.info("Soft deleting address with ID {}", id);
        CustomerInformation entity = customerInformationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa chỉ với ID: " + id));

        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        customerInformationRepository.save(entity);
    }

    @Override
    public CustomerInformationResponseDTO getById(Integer id) {
        LOGGER.info("Fetching address with ID {}", id);
        CustomerInformation entity = customerInformationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa chỉ với ID: " + id));

        if (entity.getDeleted()) {
            throw new IllegalStateException("Địa chỉ đã bị xóa");
        }

        return toResponse(entity);
    }

    private void mapToEntity(CustomerInformation entity, CustomerInformationRequestDTO requestDTO) {
        entity.setName(requestDTO.getName());
        entity.setPhoneNumber(requestDTO.getPhoneNumber());
        entity.setAddress(requestDTO.getAddress());
        entity.setProvinceName(requestDTO.getProvinceName());
        entity.setProvinceId(requestDTO.getProvinceId());
        entity.setDistrictName(requestDTO.getDistrictName());
        entity.setDistrictId(requestDTO.getDistrictId());
        entity.setWardName(requestDTO.getWardName());
        entity.setWardCode(requestDTO.getWardCode());
        entity.setIsDefault(requestDTO.getIsDefault());
    }

    private CustomerInformationResponseDTO toResponse(CustomerInformation entity) {
        return CustomerInformationResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .phoneNumber(entity.getPhoneNumber())
                .address(entity.getAddress())
                .provinceName(entity.getProvinceName())
                .provinceId(entity.getProvinceId())
                .districtName(entity.getDistrictName())
                .districtId(entity.getDistrictId())
                .wardName(entity.getWardName())
                .wardCode(entity.getWardCode())
                .isDefault(entity.getIsDefault())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private void validateCustomerInformation(CustomerInformationRequestDTO customerInfo) {
        if (customerInfo.getProvinceId() == null) {
            throw new IllegalArgumentException("Thông tin tỉnh/thành phố không được để trống");
        }
        if (customerInfo.getDistrictId() == null) {
            throw new IllegalArgumentException("Thông tin quận/huyện không được để trống");
        }
        if (customerInfo.getWardCode() == null) {
            throw new IllegalArgumentException("Thông tin xã/phường không được để trống");
        }
        if (customerInfo.getPhoneNumber() == null || customerInfo.getPhoneNumber().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống");
        }
        
        // Validate số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)
        if (!customerInfo.getPhoneNumber().matches("^(0[3|5|7|8|9])+([0-9]{8})$")) {
            throw new IllegalArgumentException("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)");
        }
        
        if (customerInfo.getName() == null || customerInfo.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên không được để trống");
        }
        
        if (customerInfo.getAddress() == null || customerInfo.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("Địa chỉ chi tiết không được để trống");
        }
    }
}