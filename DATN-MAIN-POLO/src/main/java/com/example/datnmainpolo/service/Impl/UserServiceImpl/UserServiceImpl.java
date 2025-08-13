package com.example.datnmainpolo.service.Impl.UserServiceImpl;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.dto.UserDTO.UserResponseDTO;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private Validator validator;

    @Override
    public PaginationResponse<UserResponseDTO> findByCodeAndNameofClient(
            String code, String name, String phoneNumber, String email,
            Integer minLoyaltyPoints, Integer maxLoyaltyPoints,
            LocalDate birthDate, Instant startDate, Instant endDate,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<UserEntity> pageData = userRepository.findByCodeAndNameAndRole(
                code, name, phoneNumber, email, minLoyaltyPoints, maxLoyaltyPoints,
                birthDate, startDate, endDate, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public PaginationResponse<UserResponseDTO> findByCodeAndName(String code, String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<UserEntity> pageData = userRepository.findByCodeAndName(code, name, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public PaginationResponse<UserResponseDTO> findTopPurchasers(String code, String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("purchaseCount").descending());
        Page<UserEntity> pageData = userRepository.findByRoleAndCodeAndName(Role.CLIENT, code, name, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public UserResponseDTO createUser(UserRequestDTO requestDTO) {
        log.debug("[USER_CREATE_FLOW] Start createUser rawDTO={}", safeUserRequestLog(requestDTO));
        // Auto-gen code BEFORE validation if missing
        if (isBlank(requestDTO.getCode())) {
            requestDTO.setCode(generateUserCode());
            log.debug("[USER_CREATE_FLOW] Auto-generated code={}", requestDTO.getCode());
        }
        // Default name if missing
        if (isBlank(requestDTO.getName())) {
            requestDTO.setName("Khách lẻ");
        }
        // Default email if missing -> generate placeholder unique email
        if (isBlank(requestDTO.getEmail())) {
            requestDTO.setEmail(requestDTO.getCode().toLowerCase() + "@placeholder.local");
        }
        // Password optional: if blank, auto-set random simple stub (should be improved later)
        if (isBlank(requestDTO.getPassword())) {
            requestDTO.setPassword(generateTempPassword());
            log.debug("[USER_CREATE_FLOW] Auto-generated temp password length={}", requestDTO.getPassword().length());
        } else if (requestDTO.getPassword().length() < 6) {
            log.warn("[USER_CREATE_FLOW] Password too short length={} code={}", requestDTO.getPassword().length(), requestDTO.getCode());
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
        }
        validateRequestDTO(requestDTO);
        log.debug("[USER_CREATE_FLOW] Bean validation passed for code={}", requestDTO.getCode());
        checkUniqueConstraints(requestDTO.getCode(), requestDTO.getEmail(), null);
        checkPhoneUnique(requestDTO.getPhoneNumber(), null);
        log.debug("[USER_CREATE_FLOW] Uniqueness checks passed code={} email={} phone={}", requestDTO.getCode(), requestDTO.getEmail(), requestDTO.getPhoneNumber());

        UserEntity user = mapToEntity(requestDTO);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        user.setDeleted(false);
        user.setLoyaltyPoints(0);

        user = userRepository.save(user);
        log.info("[USER_CREATE_FLOW] Persisted user id={} code={} email={}", user.getId(), user.getCode(), user.getEmail());
        return mapToResponseDTO(user);
    }

    @Override
    public UserResponseDTO updateUser(Integer id, UserRequestDTO requestDTO) {
    log.debug("[USER_UPDATE_FLOW] Start update id={} incomingDTO={}", id, safeUserRequestLog(requestDTO));
        validateRequestDTO(requestDTO);
    checkUniqueConstraints(requestDTO.getCode(), requestDTO.getEmail(), id);
    checkPhoneUnique(requestDTO.getPhoneNumber(), id);
    log.debug("[USER_UPDATE_FLOW] Validation & uniqueness passed id={}", id);

        UserEntity user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại"));

        updateEntityFromRequestDTO(user, requestDTO);
        user.setUpdatedAt(Instant.now());

        user = userRepository.save(user);
    log.info("[USER_UPDATE_FLOW] Updated user id={} code={} email={}", user.getId(), user.getCode(), user.getEmail());
        return mapToResponseDTO(user);
    }

    @Override
    public UserResponseDTO getUserById(Integer id) {
        UserEntity user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại"));
        return mapToResponseDTO(user);
    }

    @Override
    public void softDeleteUser(Integer id) {
        UserEntity user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại"));
        user.setDeleted(true);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    private void validateRequestDTO(UserRequestDTO requestDTO) {
        Set<ConstraintViolation<UserRequestDTO>> violations = validator.validate(requestDTO);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
    }

    private void checkUniqueConstraints(String code, String email, Integer excludeId) {
        if (!isBlank(code)) {
            userRepository.findByCodeAndDeletedFalse(code).ifPresent(existing -> {
                if (excludeId == null || !existing.getId().equals(excludeId)) {
                    throw new IllegalArgumentException("code: Mã người dùng đã tồn tại");
                }
            });
        }
        if (!isBlank(email)) {
            userRepository.findByEmailAndDeletedFalse(email).ifPresent(existing -> {
                if (excludeId == null || !existing.getId().equals(excludeId)) {
                    throw new IllegalArgumentException("email: Email đã tồn tại");
                }
            });
        }
    }

    private void checkPhoneUnique(String phoneNumber, Integer excludeId) {
        if (isBlank(phoneNumber)) return;
        // Tránh NonUniqueResultException: có thể đã tồn tại nhiều bản ghi trùng số điện thoại do dữ liệu cũ
        try {
            long activeCount = userRepository.countByPhoneNumberAndDeletedFalse(phoneNumber);
            if (activeCount == 0) return; // không có trùng
            if (excludeId == null) {
                throw new IllegalArgumentException("phoneNumber: Số điện thoại đã tồn tại");
            }
            // Khi update: kiểm tra có bản ghi khác id hiện tại dùng số này không
            var all = userRepository.findAllByPhoneNumber(phoneNumber);
            boolean otherActive = all.stream().anyMatch(u -> !Boolean.TRUE.equals(u.getDeleted()) && !u.getId().equals(excludeId));
            if (otherActive) {
                throw new IllegalArgumentException("phoneNumber: Số điện thoại đã tồn tại");
            }
        } catch (IllegalArgumentException ex) {
            throw ex; // giữ nguyên thông điệp chuẩn hoá field: message
        } catch (Exception ex) {
            // Fallback nếu vẫn xảy ra lỗi không mong muốn
            throw new IllegalArgumentException("phoneNumber: Số điện thoại đã tồn tại");
        }
    }

    private UserEntity mapToEntity(UserRequestDTO dto) {
        UserEntity user = new UserEntity();
        user.setRole(dto.getRole());
        user.setCode(dto.getCode());
        user.setName(dto.getName());
        user.setBirthDate(dto.getBirthDate());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setEmail(dto.getEmail());
    user.setPassword(dto.getPassword()); // CREATE bắt buộc đã check phía trên
        user.setAvatar(dto.getAvatar());
        user.setLoyaltyPoints(0);
        return user;
    }

    private UserResponseDTO mapToResponseDTO(UserEntity user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setRole(user.getRole());
        dto.setCode(user.getCode());
        dto.setName(user.getName());
        dto.setBirthDate(user.getBirthDate());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatar());
        dto.setLoyaltyPoints(user.getLoyaltyPoints());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setDeleted(user.getDeleted());
        return dto;
    }

    private void updateEntityFromRequestDTO(UserEntity user, UserRequestDTO dto) {
        user.setRole(dto.getRole());
        user.setCode(dto.getCode());
        user.setName(dto.getName());
        user.setBirthDate(dto.getBirthDate());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getPassword().length() < 6) {
                throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
            }
            user.setPassword(dto.getPassword());
        }
        user.setAvatar(dto.getAvatar());
    }

    private String generateUserCode() {
        String millis = String.valueOf(System.currentTimeMillis());
        // Lấy 8 số cuối
        String tail = millis.substring(Math.max(0, millis.length() - 8));
        return "USR" + tail;
    }

    private String generateTempPassword() {
        String base = Long.toHexString(System.currentTimeMillis());
        if (base.length() < 6) base = (base + "000000").substring(0,6);
        return base;
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    private String safeUserRequestLog(UserRequestDTO dto) {
        if (dto == null) return "null";
        return String.format("{id=%s, code=%s, email=%s, phone=%s, role=%s, passLen=%d}",
                dto.getId(), dto.getCode(), dto.getEmail(), dto.getPhoneNumber(), dto.getRole(),
                dto.getPassword() == null ? 0 : dto.getPassword().length());
    }

    public void incrementPurchaseCount(Integer userId) {
        UserEntity user = userRepository.findByIdAndDeletedFalse(userId)
                .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại"));
        user.setLoyaltyPoints(user.getLoyaltyPoints() + 1);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    @Override
    public PaginationResponse<UserResponseDTO> findByPhoneNumberOrNameOrEmailAndRole(
            String phoneNumber, String name, String email, Role role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<UserEntity> pageData = userRepository.findByPhoneNumberOrNameOrEmailAndRole(phoneNumber, name, email, role,
                pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public void updateLoyaltyPoints(Integer customerId, BigDecimal orderValue) {
        UserEntity customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));
        int addPoints = orderValue.divide(new BigDecimal("10000"), RoundingMode.FLOOR).intValue();
        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        customer.setLoyaltyPoints(currentPoints + addPoints);
        userRepository.save(customer);
    }
}