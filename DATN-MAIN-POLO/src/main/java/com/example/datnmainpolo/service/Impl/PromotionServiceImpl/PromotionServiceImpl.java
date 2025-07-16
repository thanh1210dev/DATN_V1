package com.example.datnmainpolo.service.Impl.PromotionServiceImpl;



import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionRequestDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionResponseDTO;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignPromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignSinglePromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponse;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponseDTO;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.entity.Promotion;
import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.DiscountType;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.repository.ProductDetailRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

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

    @Autowired
    private ProductDetailRepository productDetailRepository;

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

        throw new IllegalStateException("Không thể create mã khuyến mãi duy nhất sau " + maxAttempts + " lần thử");
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
    public PaginationResponse<PromotionResponseDTO> findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPrice(
            String code, String name, Instant startTime, Instant endTime, PromotionStatus status,
            BigDecimal percentageDiscountValue, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Promotion> pageData = promotionRepository.findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPrice(
                code, name, startTime, endTime, status, percentageDiscountValue, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public PromotionResponseDTO createPromotion(PromotionRequestDTO requestDTO) {

        Promotion promotion = mapToEntity(requestDTO);
        String newCode = generateUniqueCode(requestDTO.getCode());
        promotion.setCode(newCode);
        promotion.setStatus(determineStatus(requestDTO.getStartTime(), requestDTO.getEndTime(), requestDTO.getStatus()));
        promotion.setCreatedAt(Instant.now());
        promotion.setPercentageDiscountValue(requestDTO.getPercentageDiscountValue());
        promotion.setUpdatedAt(Instant.now());
        promotion.setDeleted(false);
        promotion = promotionRepository.save(promotion);
        return mapToResponseDTO(promotion);
    }

    @Override
    @Transactional
    public PromotionResponseDTO updatePromotion(Integer id, PromotionRequestDTO requestDTO) {

        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chương trình khuyến mãi"));

        // Determine the new status based on the updated startTime and endTime
        PromotionStatus newStatus = determineStatus(requestDTO.getStartTime(), requestDTO.getEndTime(), requestDTO.getStatus());

        // If the updated promotion will be COMING_SOON, check for conflicts with ACTIVE promotions
        if (newStatus == PromotionStatus.COMING_SOON) {
            // Get all product details associated with this promotion
            List<PromotionProductDetail> promotionProductDetails = promotionProductDetailRepository.findByPromotionId(id);
            for (PromotionProductDetail ppd : promotionProductDetails) {
                Integer productDetailId = ppd.getDetailProduct().getId();
                // Get all ACTIVE promotions for this product detail
                List<PromotionProductDetail> activePromotions = promotionProductDetailRepository.findActiveByProductDetailId(productDetailId);
                for (PromotionProductDetail activePpd : activePromotions) {
                    Promotion activePromotion = activePpd.getPromotion();
                    if (activePromotion.getId().equals(id)) {
                        continue; // Skip the promotion being updated
                    }
                    Instant activeStartTime = activePromotion.getStartTime();
                    Instant activeEndTime = activePromotion.getEndTime();
                    Instant newStartTime = requestDTO.getStartTime();
                    Instant newEndTime = requestDTO.getEndTime();

                    // Check if new startTime falls within an ACTIVE promotion's time range
                    if (newStartTime != null && activeStartTime != null && activeEndTime != null &&
                            (newStartTime.isAfter(activeStartTime) || newStartTime.equals(activeStartTime)) &&
                            (newStartTime.isBefore(activeEndTime) || newStartTime.equals(activeEndTime))) {
                        throw new IllegalStateException("Thời gian bắt đầu của khuyến mãi COMING_SOON trùng với khuyến mãi ACTIVE cho sản phẩm ID " + productDetailId);
                    }

                    // Check if ACTIVE promotion's endTime falls within the new COMING_SOON promotion's time range
                    if (newStartTime != null && newEndTime != null && activeEndTime != null &&
                            (activeEndTime.isAfter(newStartTime) || activeEndTime.equals(newStartTime)) &&
                            (activeEndTime.isBefore(newEndTime) || activeEndTime.equals(newEndTime))) {
                        throw new IllegalStateException("Thời gian kết thúc của khuyến mãi ACTIVE trùng với thời gian của khuyến mãi COMING_SOON cho sản phẩm ID " + productDetailId);
                    }
                }
            }
        }

        updateEntityFromRequestDTO(promotion, requestDTO);
        promotion.setStatus(newStatus);
        promotion.setUpdatedAt(Instant.now());
        promotion = promotionRepository.save(promotion);
        promotion.setPercentageDiscountValue(requestDTO.getPercentageDiscountValue());
        return mapToResponseDTO(promotion);
    }

    @Override
    public PromotionResponseDTO getPromotionById(Integer id) {
        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chương trình khuyến mãi"));
        promotion.setStatus(determineStatus(promotion.getStartTime(), promotion.getEndTime(), promotion.getStatus()));
        promotion = promotionRepository.save(promotion);
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
        Instant now = Instant.now();
        List<Promotion> expiredPromotions = promotionRepository.findByEndTimeBeforeAndStatusNot(now, PromotionStatus.EXPIRED);
        for (Promotion promotion : expiredPromotions) {
            promotion.setStatus(PromotionStatus.EXPIRED);
            promotion.setUpdatedAt(now);
            promotionRepository.save(promotion);
        }
    }

    @Override
    @Transactional
    public void updateActivePromotions() {
        Instant now = Instant.now();
        List<Promotion> promotions = promotionRepository.findByStatusInAndDeletedFalse(
                List.of(PromotionStatus.COMING_SOON, PromotionStatus.ACTIVE));
        for (Promotion promotion : promotions) {
            PromotionStatus newStatus = determineStatus(promotion.getStartTime(), promotion.getEndTime(), promotion.getStatus());
            if (newStatus != promotion.getStatus()) {
                promotion.setStatus(newStatus);
                promotion.setUpdatedAt(now);
                promotionRepository.save(promotion);
            }
        }
    }

    @Override
    @Transactional
    public void assignPromotionToProducts(AssignPromotionRequest request) {
        Promotion promotion = promotionRepository.findById(request.getPromotionId())
                .orElseThrow(() -> new IllegalStateException("Khuyến mãi không tồn tại"));
        if (!List.of(PromotionStatus.ACTIVE, PromotionStatus.COMING_SOON).contains(promotion.getStatus())) {
            throw new IllegalStateException("Khuyến mãi phải ở trạng thái ACTIVE hoặc COMING_SOON");
        }
        List<ProductDetail> productDetails = new ArrayList<>();
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            List<ProductDetail> detailsByProductIds = productDetailRepository.findByProductIds(request.getProductIds());
            productDetails.addAll(detailsByProductIds);
        }
        if (request.getProductDetailIds() != null && !request.getProductDetailIds().isEmpty()) {
            List<ProductDetail> detailsByIds = productDetailRepository.findByIds(request.getProductDetailIds());
            productDetails.addAll(detailsByIds);
        }
        if (productDetails.isEmpty()) {
            throw new IllegalStateException("Không tìm thấy chi tiết sản phẩm hợp lệ");
        }
        List<PromotionProductDetail> promotionProductDetails = new ArrayList<>();
        Instant now = Instant.now();
        for (ProductDetail productDetail : productDetails) {
            List<PromotionProductDetail> existingPromotions = promotionProductDetailRepository.findActiveByProductDetailId(productDetail.getId());
            if (promotion.getStatus() == PromotionStatus.ACTIVE) {
                if (!existingPromotions.isEmpty()) {
                    throw new IllegalStateException("Chi tiết sản phẩm ID " + productDetail.getId() + " đã có khuyến mãi đang hoạt động");
                }
            } else if (promotion.getStatus() == PromotionStatus.COMING_SOON) {
                for (PromotionProductDetail existing : existingPromotions) {
                    Promotion existingPromotion = existing.getPromotion();
                    if (existingPromotion.getEndTime() != null && promotion.getStartTime() != null &&
                            !promotion.getStartTime().isAfter(existingPromotion.getEndTime())) {
                        throw new IllegalStateException("Khuyến mãi COMING_SOON có thời gian bắt đầu trùng với khuyến mãi đang hoạt động cho sản phẩm ID " + productDetail.getId());
                    }
                }
            }
            BigDecimal price = productDetail.getPrice();
            if (price == null) {
                throw new IllegalStateException("Giá của chi tiết sản phẩm ID " + productDetail.getId() + " không được để trống");
            }
            BigDecimal discountValue = price.multiply(promotion.getPercentageDiscountValue().divide(BigDecimal.valueOf(100)));
            BigDecimal promotionalPrice = price.subtract(discountValue);
            if (promotion.getStatus() == PromotionStatus.ACTIVE) {
                productDetail.setPromotionalPrice(promotionalPrice);
            }
            PromotionProductDetail promotionDetail = new PromotionProductDetail();
            promotionDetail.setDetailProduct(productDetail);
            promotionDetail.setPromotion(promotion);
            promotionDetail.setPrice(price);
            promotionDetail.setPriceAfterPromotion(promotionalPrice);
            promotionDetail.setCreatedAt(now);
            promotionDetail.setUpdatedAt(now);
            promotionDetail.setDeleted(false);
            promotionProductDetails.add(promotionDetail);
        }
        productDetailRepository.saveAll(productDetails);
        promotionProductDetailRepository.saveAll(promotionProductDetails);
    }

    @Override
    @Transactional
    public void assignPromotionToSingleProductDetail(AssignSinglePromotionRequest request) {
        Promotion promotion = promotionRepository.findById(request.getPromotionId())
                .orElseThrow(() -> new IllegalStateException("Khuyến mãi không tồn tại"));
        if (!List.of(PromotionStatus.ACTIVE, PromotionStatus.COMING_SOON).contains(promotion.getStatus())) {
            throw new IllegalStateException("Khuyến mãi phải ở trạng thái ACTIVE hoặc COMING_SOON");
        }
        ProductDetail productDetail = productDetailRepository.findById(request.getProductDetailId())
                .orElseThrow(() -> new IllegalStateException("Sản phẩm: " + request.getProductDetailId() + " không tồn tại"));
        List<PromotionProductDetail> existingPromotions = promotionProductDetailRepository.findActiveByProductDetailId(productDetail.getId());
        if (promotion.getStatus() == PromotionStatus.ACTIVE) {
            if (!existingPromotions.isEmpty()) {
                throw new IllegalStateException("Sản phẩm đã có khuyến mãi đang hoạt động");
            }
        } else if (promotion.getStatus() == PromotionStatus.COMING_SOON) {
            for (PromotionProductDetail existing : existingPromotions) {
                Promotion existingPromotion = existing.getPromotion();
                if (existingPromotion.getEndTime() != null && promotion.getStartTime() != null &&
                        !promotion.getStartTime().isAfter(existingPromotion.getEndTime())) {
                    throw new IllegalStateException("Khuyến mãi COMING_SOON có thời gian bắt đầu trùng với khuyến mãi đang hoạt động cho sản phẩm ID " + productDetail.getId());
                }
            }
        }
        BigDecimal price = productDetail.getPrice();
        if (price == null) {
            throw new IllegalStateException("Giá của chi tiết sản phẩm ID " + productDetail.getId() + " không được để trống");
        }
        BigDecimal discountValue = price.multiply(promotion.getPercentageDiscountValue().divide(BigDecimal.valueOf(100)));
        BigDecimal promotionalPrice = price.subtract(discountValue);
        if (promotion.getStatus() == PromotionStatus.ACTIVE) {
            productDetail.setPromotionalPrice(promotionalPrice);
        }
        PromotionProductDetail promotionDetail = new PromotionProductDetail();
        promotionDetail.setDetailProduct(productDetail);
        promotionDetail.setPromotion(promotion);
        promotionDetail.setPrice(price);
        promotionDetail.setPriceAfterPromotion(promotionalPrice);
        promotionDetail.setCreatedAt(Instant.now());
        promotionDetail.setUpdatedAt(Instant.now());
        promotionDetail.setDeleted(false);
        productDetailRepository.save(productDetail);
        promotionProductDetailRepository.save(promotionDetail);
    }

    @Override
    public PaginationResponse<PromotionProductDetailResponse> getPromotionProductsByPromotionId(Integer promotionId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<PromotionProductDetail> pageData = promotionProductDetailRepository.findByPromotionIdAndDeletedFalse(promotionId, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDto));
    }


    private Promotion mapToEntity(PromotionRequestDTO dto) {
        Promotion promotion = new Promotion();

        promotion.setName(dto.getName());
        promotion.setTypePromotion(dto.getTypePromotion());
        promotion.setStartTime(dto.getStartTime());
        promotion.setEndTime(dto.getEndTime());
        promotion.setPercentageDiscountValue(dto.getPercentageDiscountValue());
        promotion.setDescription(dto.getDescription());
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
        dto.setPercentageDiscountValue(promotion.getPercentageDiscountValue());
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

        promotion.setName(dto.getName());
        promotion.setTypePromotion(dto.getTypePromotion());
        promotion.setStartTime(dto.getStartTime());
        promotion.setEndTime(dto.getEndTime());
        promotion.setPercentageDiscountValue(dto.getPercentageDiscountValue());
        promotion.setDescription(dto.getDescription());
    }

    private PromotionProductDetailResponse mapToResponseDto(PromotionProductDetail ppd) {
        PromotionProductDetailResponse response = new PromotionProductDetailResponse();
        ProductDetail productDetail = ppd.getDetailProduct();
        Promotion promotion = ppd.getPromotion();
        response.setProductDetailId(productDetail.getId());
        response.setProductCode(productDetail.getProduct().getCode());
        response.setProductName(productDetail.getProduct().getName());
        response.setPrice(productDetail.getPrice());
        response.setPromotionalPrice(productDetail.getPromotionalPrice());
        response.setProductStatus(productDetail.getStatus());
        response.setPromotionId(promotion.getId());
        response.setPromotionCode(promotion.getCode());
        response.setPromotionName(promotion.getName());
        response.setPromotionStatus(promotion.getStatus());
        response.setPriceAfterPromotion(ppd.getPriceAfterPromotion());
        response.setStartTime(promotion.getStartTime());
        response.setEndTime(promotion.getEndTime());

        response.setProductDeTailCode(productDetail.getCode());
        response.setProductDeTailSize(productDetail.getSize().getName());
        response.setProductDeTailColor(productDetail.getColor().getCode());
        response.setColorName(productDetail.getColor().getName());
        response.setImages(productDetail.getImages().stream()
                .map(image -> {
                    PromotionProductDetailResponse.ImageDTO imageDTO = new PromotionProductDetailResponse.ImageDTO();
                    imageDTO.setId(image.getId());
                    imageDTO.setUrl(image.getUrl());
                    return imageDTO;
                })
                .collect(Collectors.toList()));
        return response;
    }
}