package com.example.datnmainpolo.service.Impl.PromotionServiceImpl;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionRequestDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionResponseDTO;
import com.example.datnmainpolo.entity.Promotion;
import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.DiscountType;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.repository.PromotionProductDetailRepository;
import com.example.datnmainpolo.repository.PromotionRepository;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.PromotionService;
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
public class PromotionServiceImpl implements PromotionService {

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private UserRepository userEntityRepository;

    @Autowired
    private PromotionProductDetailRepository promotionProductDetailRepository;

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
            Optional<Promotion> existing = promotionRepository.findByCodeAndDeletedFalse(newCode);
            if (!existing.isPresent()) {
                return newCode;
            }
            attempt++;
        } while (attempt < maxAttempts);

        throw new IllegalStateException("Không thể tạo mã khuyến mãi duy nhất sau " + maxAttempts + " lần thử");
    }

    @Override
    public PaginationResponse<PromotionResponseDTO> findByCodeAndStartTimeAndEndTimeAndStatus(
            String code, Instant startTime, Instant endTime, PromotionStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Promotion> pageData = promotionRepository.findByCodeAndStartTimeAndEndTimeAndStatus(
                code, startTime, endTime, status, pageable);

        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public PromotionResponseDTO createPromotion(PromotionRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);

        Promotion promotion = mapToEntity(requestDTO);
        // Generate unique code with 5 random characters
        String newCode = generateUniqueCode(requestDTO.getCode());
        promotion.setCode(newCode);
        promotion.setCreatedAt(Instant.now());
        promotion.setUpdatedAt(Instant.now());
        promotion.setDeleted(false);

        UserEntity user = userEntityRepository.findById(requestDTO.getCreatedByUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        promotion.setCreatedByUser(user);

        promotion = promotionRepository.save(promotion);
        return mapToResponseDTO(promotion);
    }

    @Override
    public PromotionResponseDTO updatePromotion(Integer id, PromotionRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);

        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chương trình khuyến mãi"));
        updateEntityFromRequestDTO(promotion, requestDTO);
        promotion.setUpdatedAt(Instant.now());

        promotion = promotionRepository.save(promotion);
        return mapToResponseDTO(promotion);
    }

    @Override
    public PromotionResponseDTO getPromotionById(Integer id) {
        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chương trình khuyến mãi"));
        return mapToResponseDTO(promotion);
    }

    @Override
    public void softDeletePromotion(Integer id) {
        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chương trình khuyến mãi"));
        promotion.setDeleted(true);
        promotion.setUpdatedAt(Instant.now());
        promotionRepository.save(promotion);
    }

    @Override
    @Transactional
    public void updateExpiredPromotions() {
        List<Promotion> expiredPromotions = promotionRepository.findPromotionsToExpire(Instant.now());
        for (Promotion promotion : expiredPromotions) {
            promotion.setStatus(PromotionStatus.EXPIRED);
            promotion.setUpdatedAt(Instant.now());
            promotionRepository.save(promotion);
        }
    }

    @Override
    @Transactional
    public void updateActivePromotions() {
        List<Promotion> promotionsToActivate = promotionRepository.findPromotionsToActivate(Instant.now());
        for (Promotion promotion : promotionsToActivate) {
            promotion.setStatus(PromotionStatus.ACTIVE);
            promotion.setUpdatedAt(Instant.now());
            promotionRepository.save(promotion);
        }
    }

    private void validateRequestDTO(PromotionRequestDTO requestDTO) {
        Set<ConstraintViolation<PromotionRequestDTO>> violations = validator.validate(requestDTO);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }

        if (requestDTO.getStartTime() != null && requestDTO.getEndTime() != null &&
                !requestDTO.getStartTime().isBefore(requestDTO.getEndTime())) {
            throw new IllegalArgumentException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        if (DiscountType.FIXED.equals(requestDTO.getTypePromotion())) {
            if (requestDTO.getFixedDiscountValue() == null ||
                    requestDTO.getFixedDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá trị giảm cố định phải lớn hơn 0");
            }
            if (requestDTO.getPercentageDiscountValue() != null) {
                throw new IllegalArgumentException("Không được nhập phần trăm giảm khi chọn giảm cố định");
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
        } else if (DiscountType.PERCENTAGE.equals(requestDTO.getTypePromotion())) {
            if (requestDTO.getPercentageDiscountValue() == null ||
                    requestDTO.getPercentageDiscountValue().compareTo(BigDecimal.ZERO) <= 0 ||
                    requestDTO.getPercentageDiscountValue().compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Phần trăm giảm giá phải nằm trong khoảng từ 0 đến 100");
            }
            if (requestDTO.getFixedDiscountValue() != null) {
                throw new IllegalArgumentException("Không được nhập giá trị cố định khi chọn giảm theo phần trăm");
            }
        } else {
            throw new IllegalArgumentException("Kiểu giảm giá không hợp lệ");
        }

        if (requestDTO.getMaxDiscountValue() != null &&
                requestDTO.getMaxDiscountValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá trị giảm tối đa phải không âm");
        }
    }

    private Promotion mapToEntity(PromotionRequestDTO dto) {
        Promotion promotion = new Promotion();
        promotion.setCode(dto.getCode());
        promotion.setName(dto.getName());
        promotion.setTypePromotion(dto.getTypePromotion());
        promotion.setStartTime(dto.getStartTime());
        promotion.setEndTime(dto.getEndTime());
        promotion.setFixedDiscountValue(dto.getFixedDiscountValue());
        promotion.setPercentageDiscountValue(dto.getPercentageDiscountValue());
        promotion.setMaxDiscountValue(dto.getMaxDiscountValue());
        promotion.setMinOrderValue(dto.getMinOrderValue());
        promotion.setDescription(dto.getDescription());
        promotion.setStatus(dto.getStatus());
        return promotion;
    }

    private PromotionResponseDTO mapToResponseDTO(Promotion promotion) {
        PromotionResponseDTO dto = new PromotionResponseDTO();
        dto.setId(promotion.getId());
        dto.setCode(promotion.getCode());
        dto.setName(promotion.getName());
        dto.setTypePromotion(promotion.getTypePromotion());
        dto.setStartTime(promotion.getStartTime());
        dto.setEndTime(promotion.getEndTime());
        dto.setFixedDiscountValue(promotion.getFixedDiscountValue());
        dto.setPercentageDiscountValue(promotion.getPercentageDiscountValue());
        dto.setMaxDiscountValue(promotion.getMaxDiscountValue());
        dto.setMinOrderValue(promotion.getMinOrderValue());
        dto.setDescription(promotion.getDescription());
        dto.setStatus(promotion.getStatus());
        dto.setCreatedAt(promotion.getCreatedAt());
        dto.setUpdatedAt(promotion.getUpdatedAt());
        dto.setDeleted(promotion.getDeleted());
        if (promotion.getCreatedByUser() != null) {
            dto.setCreatedByUserId(promotion.getCreatedByUser().getId());
        }
        return dto;
    }

    private void updateEntityFromRequestDTO(Promotion promotion, PromotionRequestDTO dto) {
        promotion.setCode(dto.getCode());
        promotion.setName(dto.getName());
        promotion.setTypePromotion(dto.getTypePromotion());
        promotion.setStartTime(dto.getStartTime());
        promotion.setEndTime(dto.getEndTime());
        promotion.setFixedDiscountValue(dto.getFixedDiscountValue());
        promotion.setPercentageDiscountValue(dto.getPercentageDiscountValue());
        promotion.setMaxDiscountValue(dto.getMaxDiscountValue());
        promotion.setMinOrderValue(dto.getMinOrderValue());
        promotion.setDescription(dto.getDescription());
        promotion.setStatus(dto.getStatus());
        UserEntity user = userEntityRepository.findById(dto.getCreatedByUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
        promotion.setCreatedByUser(user);
    }
}