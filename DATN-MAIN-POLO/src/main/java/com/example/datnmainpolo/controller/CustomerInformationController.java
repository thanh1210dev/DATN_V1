package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationResponseDTO;
import com.example.datnmainpolo.service.CustomerInformationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-information")
@RequiredArgsConstructor
public class CustomerInformationController {
    private static final Logger LOGGER = LoggerFactory.getLogger(CustomerInformationController.class);
    private final CustomerInformationService customerInformationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CustomerInformationResponseDTO>> getUserAddresses(@PathVariable Integer userId) {
        LOGGER.info("Fetching addresses for user {}", userId);
        try {
            List<CustomerInformationResponseDTO> addresses = customerInformationService.getAddressesByUserId(userId);
            return ResponseEntity.ok(addresses);
        } catch (Exception e) {
            LOGGER.error("Error fetching addresses for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Lỗi khi lấy danh sách địa chỉ: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}/default")
    public ResponseEntity<CustomerInformationResponseDTO> getDefaultAddress(@PathVariable Integer userId) {
        LOGGER.info("Fetching default address for user {}", userId);
        try {
            CustomerInformationResponseDTO defaultAddress = customerInformationService.getDefaultAddressByUserId(userId);
            return ResponseEntity.ok(defaultAddress);
        } catch (Exception e) {
            LOGGER.error("Error fetching default address for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Lỗi khi lấy địa chỉ mặc định: " + e.getMessage());
        }
    }

    @PutMapping("/user/{userId}/default/{addressId}")
    public ResponseEntity<CustomerInformationResponseDTO> setDefaultAddress(
            @PathVariable Integer userId,
            @PathVariable Integer addressId) {
        LOGGER.info("Setting default address with ID {} for user {}", addressId, userId);
        try {
            CustomerInformationResponseDTO updatedAddress = customerInformationService.setDefaultAddress(userId, addressId);
            return ResponseEntity.ok(updatedAddress);
        } catch (Exception e) {
            LOGGER.error("Error setting default address with ID {} for user {}: {}", addressId, userId, e.getMessage());
            throw new RuntimeException("Lỗi khi đặt địa chỉ mặc định: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<CustomerInformationResponseDTO> addAddress(
            @RequestParam Integer userId,
            @RequestBody CustomerInformationRequestDTO requestDTO) {
        LOGGER.info("Adding new address for user {}", userId);
        try {
            CustomerInformationResponseDTO savedAddress = customerInformationService.saveAddress(requestDTO, userId);
            return ResponseEntity.ok(savedAddress);
        } catch (Exception e) {
            LOGGER.error("Error adding address for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Lỗi khi thêm địa chỉ: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerInformationResponseDTO> updateAddress(
            @PathVariable Integer id,
            @RequestBody CustomerInformationRequestDTO requestDTO) {
        LOGGER.info("Updating address with ID {} for user", id);
        try {
            CustomerInformationResponseDTO updatedAddress = customerInformationService.updateAddress(id, requestDTO);
            return ResponseEntity.ok(updatedAddress);
        } catch (Exception e) {
            LOGGER.error("Error updating address with ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Lỗi khi cập nhật địa chỉ: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteAddress(@PathVariable Integer id) {
        LOGGER.info("Soft deleting address with ID {}", id);
        try {
            customerInformationService.softDelete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            LOGGER.error("Error soft deleting address with ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Lỗi khi xóa địa chỉ: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerInformationResponseDTO> getAddressById(@PathVariable Integer id) {
        LOGGER.info("Fetching address with ID {}", id);
        try {
            CustomerInformationResponseDTO address = customerInformationService.getById(id);
            return ResponseEntity.ok(address);
        } catch (Exception e) {
            LOGGER.error("Error fetching address with ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Lỗi khi lấy địa chỉ: " + e.getMessage());
        }
    }
}