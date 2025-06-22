package com.example.datnmainpolo.service.Impl.VoucherServiceImpl;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import com.example.datnmainpolo.enums.VoucherTypeUser;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.repository.VoucherRepository;
import com.example.datnmainpolo.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;

@Service
public class VoucherServiceImpl implements VoucherService {

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private UserRepository userEntityRepository;

    @Autowired
    private Validator validator;

    private static final String RANDOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int RANDOM_LENGTH = 5;

    private String generateRandomCode(String baseCode) {
        StringBuilder randomPart = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < RANDOM_LENGTH; i++) {
            randomPart.append(RANDOM_CHARS.charAt(random.nextInt(RANDOM_CHARS.length())));
        }
        return baseCode + randomPart.toString();
    }

    private String generateUniqueCode(String baseCode) {
        String newCode;
        int maxAttempts = 10;
        int attempt = 0;

        do {
            newCode = generateRandomCode(baseCode);
            Optional<Voucher> existing = voucherRepository.findByCodeAndDeletedFalse(newCode);
            if (!existing.isPresent()) {
                return newCode;
            }
            attempt++;
        } while (attempt < maxAttempts);

        throw new IllegalStateException("Không thể tạo mã voucher duy nhất sau " + maxAttempts + " lần thử");
    }

    private PromotionStatus determineStatus(Instant startTime, Instant endTime, PromotionStatus requestedStatus) {
        Instant now = Instant.now();
        if (startTime != null && startTime.isAfter(now)) {
            return PromotionStatus.COMING_SOON;
        } else if (startTime != null && endTime != null && startTime.isBefore(now) && endTime.isAfter(now)) {
            return PromotionStatus.ACTIVE;
        } else if (endTime != null && endTime.isBefore(now)) {
            return PromotionStatus.EXPIRED;
        } else if (requestedStatus == PromotionStatus.USED_UP || requestedStatus == PromotionStatus.INACTIVE) {
            return requestedStatus;
        }
        return PromotionStatus.ACTIVE;
    }

    @Override
    public PaginationResponse<VoucherResponseDTO> findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPriceAndTypeUser(
            String code, String name, Instant startTime, Instant endTime, PromotionStatus status,
            BigDecimal percentageDiscountValue, BigDecimal fixedDiscountValue, BigDecimal maxDiscountValue,
            VoucherTypeUser typeUser, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Voucher> pageData = voucherRepository.findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPriceAndTypeUser(
                code, name, startTime, endTime, status, percentageDiscountValue, fixedDiscountValue, maxDiscountValue, typeUser, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    @Transactional
    public VoucherResponseDTO createVoucher(VoucherRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);

        String newCode = generateUniqueCode(requestDTO.getCode());

        Voucher voucher = mapToEntity(requestDTO);
        voucher.setCode(newCode);
        voucher.setStatus(determineStatus(requestDTO.getStartTime(), requestDTO.getEndTime(), requestDTO.getStatus()));
        voucher.setCreatedAt(Instant.now());
        voucher.setUpdatedAt(Instant.now());
        voucher.setDeleted(false);

        UserEntity user = userEntityRepository.findById(requestDTO.getCreatedByUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        voucher.setCreatedByUser(user);

        voucher = voucherRepository.save(voucher);
        return mapToResponseDTO(voucher);
    }

    @Override
    @Transactional
    public VoucherResponseDTO updateVoucher(Integer id, VoucherRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);

        Voucher voucher = voucherRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy voucher"));
        updateEntityFromRequestDTO(voucher, requestDTO);
        voucher.setStatus(determineStatus(requestDTO.getStartTime(), requestDTO.getEndTime(), requestDTO.getStatus()));
        voucher.setUpdatedAt(Instant.now());

        voucher = voucherRepository.save(voucher);
        return mapToResponseDTO(voucher);
    }

    @Override
    public VoucherResponseDTO getVoucherById(Integer id) {
        Voucher voucher = voucherRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy voucher"));
        voucher.setStatus(determineStatus(voucher.getStartTime(), voucher.getEndTime(), voucher.getStatus()));
        voucher = voucherRepository.save(voucher);
        return mapToResponseDTO(voucher);
    }

    @Override
    public void softDeleteVoucher(Integer id) {
        Voucher voucher = voucherRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy voucher"));
        voucher.setDeleted(true);
        voucher.setUpdatedAt(Instant.now());
        voucherRepository.save(voucher);
    }

    @Override
    @Transactional
    public void updateExpiredVouchers() {
        Instant now = Instant.now();
        List<Voucher> expiredVouchers = voucherRepository.findByEndTimeBeforeAndStatusNot(now, PromotionStatus.EXPIRED);
        for (Voucher voucher : expiredVouchers) {
            voucher.setStatus(PromotionStatus.EXPIRED);
            voucher.setUpdatedAt(now);
            voucherRepository.save(voucher);
        }
    }

    @Override
    @Transactional
    public void updateActiveVouchers() {
        Instant now = Instant.now();
        List<Voucher> vouchers = voucherRepository.findByStatusInAndDeletedFalse(
                List.of(PromotionStatus.COMING_SOON, PromotionStatus.ACTIVE));
        for (Voucher voucher : vouchers) {
            PromotionStatus newStatus = determineStatus(voucher.getStartTime(), voucher.getEndTime(), voucher.getStatus());
            if (newStatus != voucher.getStatus()) {
                voucher.setStatus(newStatus);
                voucher.setUpdatedAt(now);
                voucherRepository.save(voucher);
            }
        }
    }

    private void validateRequestDTO(VoucherRequestDTO requestDTO) {
        Set<ConstraintViolation<VoucherRequestDTO>> violations = validator.validate(requestDTO);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }

        if (requestDTO.getStartTime() != null && requestDTO.getEndTime() != null &&
                !requestDTO.getStartTime().isBefore(requestDTO.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        if (VoucherType.PERCENTAGE.equals(requestDTO.getType())) {
            if (requestDTO.getPercentageDiscountValue() == null ||
                    requestDTO.getPercentageDiscountValue().compareTo(BigDecimal.ZERO) <= 0 ||
                    requestDTO.getPercentageDiscountValue().compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Phần trăm giảm giá phải nằm trong khoảng từ 0 đến 100");
            }
            if (requestDTO.getMaxDiscountValue() == null ||
                    requestDTO.getMaxDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá trị giảm tối đa phải lớn hơn 0 khi loại là PERCENT");
            }
        } else if (VoucherType.FIXED.equals(requestDTO.getType())) {
            if (requestDTO.getFixedDiscountValue() == null ||
                    requestDTO.getFixedDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá trị giảm cố định phải lớn hơn 0");
            }
            if (requestDTO.getMinOrderValue() == null ||
                    requestDTO.getMinOrderValue().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Giá trị đơn hàng tối thiểu phải không âm");
            }
            if (requestDTO.getFixedDiscountValue() != null &&
                    requestDTO.getMinOrderValue() != null &&
                    requestDTO.getFixedDiscountValue().compareTo(requestDTO.getMinOrderValue()) > 0) {
                throw new IllegalArgumentException("Giá trị giảm cố định không được lớn hơn giá trị đơn hàng tối thiểu");
            }
        } else {
            throw new IllegalArgumentException("Loại voucher không hợp lệ");
        }

        if (requestDTO.getQuantity() != null && requestDTO.getQuantity() < 0) {
            throw new IllegalArgumentException("Số lượng voucher phải không âm");
        }

        // Additional validation for PRIVATE vouchers (placeholder)
        if (VoucherTypeUser.PRIVATE.equals(requestDTO.getTypeUser())) {
            // Future implementation: Validate if the voucher is assigned to specific users
            // For now, just ensure typeUser is valid (handled by @NotNull)
        }
    }

    private Voucher mapToEntity(VoucherRequestDTO dto) {
        Voucher voucher = new Voucher();
        voucher.setCode(dto.getCode());
        voucher.setName(dto.getName());
        voucher.setType(dto.getType());
        voucher.setStartTime(dto.getStartTime());
        voucher.setEndTime(dto.getEndTime());
        voucher.setQuantity(dto.getQuantity());
        voucher.setFixedDiscountValue(dto.getFixedDiscountValue());
        voucher.setPercentageDiscountValue(dto.getPercentageDiscountValue());
        voucher.setMaxDiscountValue(dto.getMaxDiscountValue());
        voucher.setMinOrderValue(dto.getMinOrderValue());
        voucher.setTypeUser(dto.getTypeUser()); // New field
        return voucher;
    }

    private VoucherResponseDTO mapToResponseDTO(Voucher voucher) {
        VoucherResponseDTO dto = new VoucherResponseDTO();
        dto.setId(voucher.getId());
        dto.setCode(voucher.getCode());
        dto.setName(voucher.getName());
        dto.setType(voucher.getType());
        dto.setStartTime(voucher.getStartTime());
        dto.setEndTime(voucher.getEndTime());
        dto.setQuantity(voucher.getQuantity());
        dto.setStatus(voucher.getStatus());
        dto.setFixedDiscountValue(voucher.getFixedDiscountValue());
        dto.setPercentageDiscountValue(voucher.getPercentageDiscountValue());
        dto.setMaxDiscountValue(voucher.getMaxDiscountValue());
        dto.setMinOrderValue(voucher.getMinOrderValue());
        dto.setCreatedAt(voucher.getCreatedAt());
        dto.setUpdatedAt(voucher.getUpdatedAt());
        dto.setDeleted(voucher.getDeleted());
        dto.setTypeUser(voucher.getTypeUser()); // New field
        if (voucher.getCreatedByUser() != null) {
            dto.setCreatedByUserId(voucher.getCreatedByUser().getId());
        }
        return dto;
    }

    private void updateEntityFromRequestDTO(Voucher voucher, VoucherRequestDTO dto) {
        voucher.setCode(dto.getCode());
        voucher.setName(dto.getName());
        voucher.setType(dto.getType());
        voucher.setStartTime(dto.getStartTime());
        voucher.setEndTime(dto.getEndTime());
        voucher.setQuantity(dto.getQuantity());
        voucher.setFixedDiscountValue(dto.getFixedDiscountValue());
        voucher.setPercentageDiscountValue(dto.getPercentageDiscountValue());
        voucher.setMaxDiscountValue(dto.getMaxDiscountValue());
        voucher.setMinOrderValue(dto.getMinOrderValue());
        voucher.setTypeUser(dto.getTypeUser()); // New field
        UserEntity user = userEntityRepository.findById(dto.getCreatedByUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        voucher.setCreatedByUser(user);
    }
}