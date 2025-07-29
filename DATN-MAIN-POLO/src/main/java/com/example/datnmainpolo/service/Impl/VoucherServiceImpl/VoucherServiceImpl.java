package com.example.datnmainpolo.service.Impl.VoucherServiceImpl;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.entity.AccountVoucher;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import com.example.datnmainpolo.enums.VoucherTypeUser;
import com.example.datnmainpolo.repository.AccountVoucherRepository;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.repository.VoucherRepository;
import com.example.datnmainpolo.service.VoucherService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

@Service
public class VoucherServiceImpl implements VoucherService {

    private static final Logger logger = LoggerFactory.getLogger(VoucherServiceImpl.class);

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private UserRepository userEntityRepository;
    
    @Autowired
    private AccountVoucherRepository accountVoucherRepository;

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
        
        // Auto-update voucher statuses before searching
        this.updateActiveVouchers();
        this.updateExpiredVouchers();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Voucher> pageData = voucherRepository.findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPriceAndTypeUser(
                code, name, startTime, endTime, status, percentageDiscountValue, fixedDiscountValue, maxDiscountValue, typeUser, pageable);
        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    @Transactional
    public VoucherResponseDTO createVoucher(VoucherRequestDTO requestDTO) {
        System.out.println("=== VoucherServiceImpl.createVoucher START ===");
        System.out.println("RequestDTO: " + requestDTO);
        
        try {
            validateRequestDTO(requestDTO);
            System.out.println("Validation passed");

            String newCode = generateUniqueCode(requestDTO.getCode());
            System.out.println("Generated code: " + newCode);

            Voucher voucher = mapToEntity(requestDTO);
            voucher.setCode(newCode);
            voucher.setStatus(determineStatus(requestDTO.getStartTime(), requestDTO.getEndTime(), requestDTO.getStatus()));
            voucher.setCreatedAt(Instant.now());
            voucher.setUpdatedAt(Instant.now());
            voucher.setDeleted(false);

            System.out.println("Finding user with ID: " + requestDTO.getCreatedByUserId());
            UserEntity user = userEntityRepository.findById(requestDTO.getCreatedByUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng"));
            voucher.setCreatedByUser(user);
            System.out.println("User found: " + user.getName());

            System.out.println("Saving voucher to database...");
            voucher = voucherRepository.save(voucher);
            System.out.println("Voucher saved with ID: " + voucher.getId());
            
            VoucherResponseDTO response = mapToResponseDTO(voucher);
            System.out.println("=== VoucherServiceImpl.createVoucher END ===");
            return response;
        } catch (Exception e) {
            System.err.println("Error in createVoucher: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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

    @Override
    public List<VoucherResponseDTO> getAvailableVouchersForUser(Integer userId, BigDecimal orderAmount) {
        // Auto-update voucher statuses before searching
        this.updateActiveVouchers();
        this.updateExpiredVouchers();
        
        Instant now = Instant.now();
        List<VoucherResponseDTO> availableVouchers = new ArrayList<>();
        
        // 1. Lấy voucher PUBLIC (cho tất cả mọi người)
        List<Voucher> publicVouchers = voucherRepository.findByStatusAndEndTimeAfterAndQuantityGreaterThan(
                PromotionStatus.ACTIVE, now, 0);
        
        List<VoucherResponseDTO> publicVoucherDTOs = publicVouchers.stream()
                .filter(voucher -> {
                    // Kiểm tra thời gian bắt đầu
                    return voucher.getStartTime().isBefore(now) || voucher.getStartTime().equals(now);
                })
                .filter(voucher -> {
                    // Chỉ lấy voucher PUBLIC
                    return voucher.getTypeUser() == VoucherTypeUser.PUBLIC;
                })
                .filter(voucher -> {
                    // Kiểm tra giá trị đơn hàng tối thiểu
                    return voucher.getMinOrderValue() == null || 
                           orderAmount.compareTo(voucher.getMinOrderValue()) >= 0;
                })
                .map(this::mapToResponseDTO)
                .toList();
                
        availableVouchers.addAll(publicVoucherDTOs);
        
        // 2. Lấy voucher PRIVATE được phân cho user này (nếu có userId)
        if (userId != null) {
            List<AccountVoucher> userVouchers = accountVoucherRepository.findByUserEntityIdAndStatusTrueAndDeletedFalse(userId);
            
            List<VoucherResponseDTO> privateVoucherDTOs = userVouchers.stream()
                    .map(AccountVoucher::getVoucher)
                    .filter(voucher -> {
                        // Kiểm tra voucher còn hiệu lực
                        return voucher.getStatus() == PromotionStatus.ACTIVE &&
                               voucher.getQuantity() > 0 &&
                               !voucher.getDeleted() &&
                               (voucher.getEndTime() == null || voucher.getEndTime().isAfter(now));
                    })
                    .filter(voucher -> {
                        // Kiểm tra thời gian bắt đầu
                        return voucher.getStartTime() == null || 
                               voucher.getStartTime().isBefore(now) || 
                               voucher.getStartTime().equals(now);
                    })
                    .filter(voucher -> {
                        // Chỉ lấy voucher PRIVATE
                        return voucher.getTypeUser() == VoucherTypeUser.PRIVATE;
                    })
                    .filter(voucher -> {
                        // Kiểm tra giá trị đơn hàng tối thiểu
                        return voucher.getMinOrderValue() == null || 
                               orderAmount.compareTo(voucher.getMinOrderValue()) >= 0;
                    })
                    .map(this::mapToResponseDTO)
                    .toList();
                    
            availableVouchers.addAll(privateVoucherDTOs);
        }
        
        return availableVouchers;
    }
    
    @Override
    public List<VoucherResponseDTO> getPrivateVouchersForUser(Integer userId, BigDecimal orderAmount) {
        logger.info("Getting private vouchers for user {} with order amount {}", userId, orderAmount);
        
        // Auto-update voucher statuses before searching
        this.updateActiveVouchers();
        this.updateExpiredVouchers();
        
        if (userId == null) {
            logger.warn("UserId is null, returning empty list");
            return new ArrayList<>();
        }
        
        Instant now = Instant.now();
        
        // Lấy voucher PRIVATE được phân cho user này
        List<AccountVoucher> userVouchers = accountVoucherRepository.findByUserEntityIdAndStatusTrueAndDeletedFalse(userId);
        logger.info("Found {} AccountVoucher records for userId {}", userVouchers.size(), userId);
        
        List<VoucherResponseDTO> privateVoucherDTOs = userVouchers.stream()
                .peek(accountVoucher -> {
                    Voucher voucher = accountVoucher.getVoucher();
                    logger.info("Processing voucher: id={}, code={}, type={}, status={}, quantity={}, deleted={}", 
                               voucher.getId(), voucher.getCode(), voucher.getTypeUser(), 
                               voucher.getStatus(), voucher.getQuantity(), voucher.getDeleted());
                })
                .map(AccountVoucher::getVoucher)
                .filter(voucher -> {
                    // Kiểm tra voucher còn hiệu lực
                    boolean isValid = voucher.getStatus() == PromotionStatus.ACTIVE &&
                           voucher.getQuantity() > 0 &&
                           !voucher.getDeleted() &&
                           (voucher.getEndTime() == null || voucher.getEndTime().isAfter(now));
                    logger.info("Voucher {} validity check: {}", voucher.getCode(), isValid);
                    return isValid;
                })
                .filter(voucher -> {
                    // Kiểm tra thời gian bắt đầu
                    boolean startTimeOk = voucher.getStartTime() == null || 
                           voucher.getStartTime().isBefore(now) || 
                           voucher.getStartTime().equals(now);
                    logger.info("Voucher {} start time check: {}", voucher.getCode(), startTimeOk);
                    return startTimeOk;
                })
                .filter(voucher -> {
                    // Chỉ lấy voucher PRIVATE
                    boolean isPrivate = voucher.getTypeUser() == VoucherTypeUser.PRIVATE;
                    logger.info("Voucher {} is PRIVATE: {}", voucher.getCode(), isPrivate);
                    return isPrivate;
                })
                .filter(voucher -> {
                    // Kiểm tra giá trị đơn hàng tối thiểu
                    boolean minOrderOk = voucher.getMinOrderValue() == null || 
                           orderAmount.compareTo(voucher.getMinOrderValue()) >= 0;
                    logger.info("Voucher {} min order check: {} (required: {}, actual: {})", 
                               voucher.getCode(), minOrderOk, voucher.getMinOrderValue(), orderAmount);
                    return minOrderOk;
                })
                .map(this::mapToResponseDTO)
                .toList();
                
        logger.info("Final result: {} private vouchers for user {}", privateVoucherDTOs.size(), userId);
        return privateVoucherDTOs;
    }

    @Override
    public VoucherResponseDTO getVoucherByCodeForUser(String code, Integer userId, BigDecimal orderAmount) {
        logger.info("Trying to get voucher by code: {}, userId: {}, orderAmount: {}", code, userId, orderAmount);
        Instant now = Instant.now();
        
        // Try flexible search first
        Optional<Voucher> voucherOpt = voucherRepository.findByCodeFlexible(code);
        
        // If flexible search fails, try exact match
        if (voucherOpt.isEmpty()) {
            voucherOpt = voucherRepository.findByCodeAndNotDeleted(code);
        }
        
        if (voucherOpt.isEmpty()) {
            logger.warn("Voucher with code {} not found or deleted", code);
            throw new EntityNotFoundException("Mã voucher không tồn tại hoặc đã bị xóa");
        }
        
        Voucher voucher = voucherOpt.get();
        logger.info("Found voucher: id={}, code={}, type={}, status={}, deleted={}", 
                   voucher.getId(), voucher.getCode(), voucher.getTypeUser(), voucher.getStatus(), voucher.getDeleted());
        
        // Kiểm tra trạng thái
        if (voucher.getStatus() != PromotionStatus.ACTIVE) {
            logger.warn("Voucher {} is not active. Status: {}", code, voucher.getStatus());
            throw new IllegalArgumentException("Voucher không còn hiệu lực");
        }
        
        // Kiểm tra thời gian
        if (voucher.getStartTime() != null && voucher.getStartTime().isAfter(now)) {
            logger.warn("Voucher {} not yet started. Start time: {}, current time: {}", code, voucher.getStartTime(), now);
            throw new IllegalArgumentException("Voucher chưa có hiệu lực");
        }
        
        if (voucher.getEndTime() != null && voucher.getEndTime().isBefore(now)) {
            logger.warn("Voucher {} has expired. End time: {}, current time: {}", code, voucher.getEndTime(), now);
            throw new IllegalArgumentException("Voucher đã hết hạn");
        }
        
        // Kiểm tra số lượng
        if (voucher.getQuantity() <= 0) {
            logger.warn("Voucher {} has no quantity left. Quantity: {}", code, voucher.getQuantity());
            throw new IllegalArgumentException("Voucher đã hết");
        }
        
        // Kiểm tra loại user và quyền truy cập
        if (voucher.getTypeUser() == VoucherTypeUser.PUBLIC) {
            logger.info("Voucher {} is PUBLIC - accessible to all users", code);
            // Voucher PUBLIC - ai cũng có thể dùng
        } else if (voucher.getTypeUser() == VoucherTypeUser.PRIVATE) {
            logger.info("Voucher {} is PRIVATE - checking user access for userId: {}", code, userId);
            // Voucher PRIVATE - chỉ user được phân mới có thể dùng
            if (userId == null) {
                logger.warn("User not logged in but trying to access PRIVATE voucher {}", code);
                throw new IllegalArgumentException("Bạn cần đăng nhập để sử dụng voucher này");
            }
            
            // Kiểm tra xem user có được phân voucher này không
            boolean hasAccess = accountVoucherRepository.existsByVoucherIdAndUserEntityIdAndDeletedFalse(
                voucher.getId(), userId);
            
            logger.info("User {} access check for PRIVATE voucher {}: {}", userId, code, hasAccess);
            if (!hasAccess) {
                logger.warn("User {} does not have access to PRIVATE voucher {}", userId, code);
                throw new IllegalArgumentException("Bạn không có quyền sử dụng voucher này");
            }
        } else {
            logger.error("Invalid voucher type for voucher {}: {}", code, voucher.getTypeUser());
            throw new IllegalArgumentException("Loại voucher không hợp lệ");
        }
        
        // Kiểm tra giá trị đơn hàng tối thiểu
        if (voucher.getMinOrderValue() != null && 
            orderAmount.compareTo(voucher.getMinOrderValue()) < 0) {
            logger.warn("Order amount {} is less than minimum required {} for voucher {}", 
                       orderAmount, voucher.getMinOrderValue(), code);
            throw new IllegalArgumentException("Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher");
        }
        
        logger.info("Successfully validated voucher {} for user {}", code, userId);
        return mapToResponseDTO(voucher);
    }
    
    @Override
    public VoucherResponseDTO getVoucherByCodeInfo(String code) {
        logger.info("Getting voucher info by code: {}", code);
        
        // Try flexible search first
        Optional<Voucher> voucherOpt = voucherRepository.findByCodeFlexible(code);
        
        // If flexible search fails, try exact match
        if (voucherOpt.isEmpty()) {
            voucherOpt = voucherRepository.findByCodeAndNotDeleted(code);
        }
        
        if (voucherOpt.isEmpty()) {
            logger.warn("Voucher with code {} not found or deleted", code);
            throw new EntityNotFoundException("Mã voucher không tồn tại hoặc đã bị xóa");
        }
        
        Voucher voucher = voucherOpt.get();
        logger.info("Found voucher: id={}, code={}, type={}, status={}, deleted={}", 
                   voucher.getId(), voucher.getCode(), voucher.getTypeUser(), voucher.getStatus(), voucher.getDeleted());
        
        logger.info("Successfully retrieved voucher info for code {}", code);
        return mapToResponseDTO(voucher);
    }
}