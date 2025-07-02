package com.example.datnmainpolo.service.Impl.UserServiceImpl;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.dto.UserDTO.UserResponseDTO;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private Validator validator;

    @Override
    public PaginationResponse<UserResponseDTO> findByCodeAndName(String code, String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<UserEntity> pageData = userRepository.findByCodeAndName(code, name, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public PaginationResponse<UserResponseDTO> findByCodeAndNameofClient(
            String code, String name, String phoneNumber, String email,
            String startDate, String endDate, Boolean isBirthday,
            Integer minPoints, Integer maxPoints, String memberTier,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("loyaltyPoints").descending());

        // Chuyển đổi startDate và endDate từ String sang Instant
        Instant startInstant = null;
        Instant endInstant = null;
        if (startDate != null && !startDate.isEmpty()) {
            startInstant = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE)
                    .atStartOfDay(ZoneId.systemDefault()).toInstant();
        }
        if (endDate != null && !endDate.isEmpty()) {
            endInstant = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE)
                    .atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();
        }

        Page<UserEntity> pageData = userRepository.findByCodeAndNameofClient(
                code, name, phoneNumber, email, startInstant, endInstant, isBirthday,
                minPoints, maxPoints, memberTier, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public UserResponseDTO createUser(UserRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);
        checkUniqueConstraints(requestDTO.getCode(), requestDTO.getEmail(), null);

        UserEntity user = mapToEntity(requestDTO);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        user.setDeleted(false);
        user.setLoyaltyPoints(0);

        user = userRepository.save(user);
        return mapToResponseDTO(user);
    }

    @Override
    public UserResponseDTO updateUser(Integer id, UserRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);
        checkUniqueConstraints(requestDTO.getCode(), requestDTO.getEmail(), id);

        UserEntity user = userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại"));

        updateEntityFromRequestDTO(user, requestDTO);
        user.setUpdatedAt(Instant.now());

        user = userRepository.save(user);
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
        Optional<UserEntity> existingByCode = userRepository.findByCodeAndDeletedFalse(code);
        if (existingByCode.isPresent() && (excludeId == null || !existingByCode.get().getId().equals(excludeId))) {
            throw new IllegalArgumentException("Mã người dùng đã tồn tại");
        }

        Optional<UserEntity> existingByEmail = userRepository.findByEmailAndDeletedFalse(email);
        if (existingByEmail.isPresent() && (excludeId == null || !existingByEmail.get().getId().equals(excludeId))) {
            throw new IllegalArgumentException("Email đã tồn tại");
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
        user.setPassword(dto.getPassword());
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
        user.setPassword(dto.getPassword());
        user.setAvatar(dto.getAvatar());
    }
}