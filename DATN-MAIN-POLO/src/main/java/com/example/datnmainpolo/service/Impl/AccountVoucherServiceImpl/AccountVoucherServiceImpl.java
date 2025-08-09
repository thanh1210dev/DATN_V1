package com.example.datnmainpolo.service.Impl.AccountVoucherServiceImpl;


import com.example.datnmainpolo.dto.AccountVoucherDTO.AccountVoucherAssignDTO;
import com.example.datnmainpolo.dto.AccountVoucherDTO.AccountVoucherResponseDTO;
import com.example.datnmainpolo.dto.AccountVoucherDTO.ClientAccountVoucherDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.AccountVoucher;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.repository.AccountVoucherRepository;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.repository.VoucherRepository;
import com.example.datnmainpolo.service.AccountVoucherService;
import com.example.datnmainpolo.service.Impl.Email.EmailService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.persistence.EntityNotFoundException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountVoucherServiceImpl implements AccountVoucherService {

    private final AccountVoucherRepository accountVoucherRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AccountVoucherServiceImpl(AccountVoucherRepository accountVoucherRepository,
                                     VoucherRepository voucherRepository,
                                     UserRepository userRepository,
                                     EmailService emailService) {
        this.accountVoucherRepository = accountVoucherRepository;
        this.voucherRepository = voucherRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Override
    public PaginationResponse<AccountVoucherResponseDTO> getAllByStatusAndDeletedFalse(PromotionStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<AccountVoucher> pageData = accountVoucherRepository.findAllByStatusAndDeletedFalse(status, pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    @Override
    @Transactional
    public void assignVoucherToUsers(AccountVoucherAssignDTO assignDTO) {
        Voucher voucher = voucherRepository.findByIdAndDeletedFalse(assignDTO.getVoucherId())
                .orElseThrow(() -> new EntityNotFoundException("Voucher không tồn tại"));

        // Chỉ cho phép phân cho người dùng khi voucher là PRIVATE
        if (voucher.getTypeUser() == null || voucher.getTypeUser() != com.example.datnmainpolo.enums.VoucherTypeUser.PRIVATE) {
            throw new IllegalArgumentException("Chỉ voucher PRIVATE mới được phân cho người dùng");
        }

        if (voucher.getStatus() != PromotionStatus.COMING_SOON && voucher.getStatus() != PromotionStatus.ACTIVE) {
            throw new IllegalArgumentException("Chỉ có thể gán voucher ở trạng thái Sắp ra mắt hoặc Đang hoạt động");
        }

        Integer assignQuantity = assignDTO.getQuantity();
        if (assignQuantity == null || assignQuantity <= 0) {
            throw new IllegalArgumentException("Số lượng voucher phải lớn hơn 0");
        }

        if (voucher.getQuantity() < assignQuantity * assignDTO.getUserIds().size()) {
            throw new IllegalArgumentException("Số lượng voucher còn lại không đủ để phân bổ");
        }

        for (Integer userId : assignDTO.getUserIds()) {
            UserEntity user = userRepository.findByIdAndDeletedFalse(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại với ID: " + userId));

            // If already assigned, increase quantity; else create new
            AccountVoucher accountVoucher = accountVoucherRepository
                    .findByUserEntityIdAndVoucherIdAndDeletedFalse(userId, assignDTO.getVoucherId());

            if (accountVoucher != null) {
                int newQty = (accountVoucher.getQuantity() == null ? 0 : accountVoucher.getQuantity()) + assignQuantity;
                accountVoucher.setQuantity(newQty);
                accountVoucher.setUpdatedAt(Instant.now());
                // Keep status as-is; ensure not deleted
                accountVoucher.setDeleted(false);
                accountVoucherRepository.save(accountVoucher);
            } else {
                accountVoucher = new AccountVoucher();
                accountVoucher.setVoucher(voucher);
                accountVoucher.setUserEntity(user);
                accountVoucher.setQuantity(assignQuantity);
                // status=false means available/unused
                accountVoucher.setStatus(false);
                accountVoucher.setCreatedAt(Instant.now());
                accountVoucher.setUpdatedAt(Instant.now());
                accountVoucher.setDeleted(false);
                accountVoucherRepository.save(accountVoucher);
            }

            // Trừ số lượng voucher kho tổng
            voucher.setQuantity(voucher.getQuantity() - assignQuantity);
            // Mark USED_UP when quantity reaches 0 (or below)
            if (voucher.getQuantity() != null && voucher.getQuantity() <= 0) {
                voucher.setQuantity(0);
                voucher.setStatus(PromotionStatus.USED_UP);
            }
            voucher.setUpdatedAt(Instant.now());
            voucherRepository.save(voucher);

            try {
                emailService.sendVoucherAssignmentEmail(
                        user.getEmail(),
                        user.getName(),
                        voucher
                );
            } catch (MessagingException e) {
                System.err.println("Failed to send email to " + user.getEmail() + ": " + e.getMessage());
            }
        }
    }

    @Override
    public PaginationResponse<AccountVoucherResponseDTO> getUsersByVoucherId(Integer voucherId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<AccountVoucher> pageData = accountVoucherRepository.findByVoucherId(voucherId, pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    @Override
    public PaginationResponse<AccountVoucherResponseDTO> getVouchersByUserId(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<AccountVoucher> pageData = accountVoucherRepository.findByUserId(userId, pageable);
        return new PaginationResponse<AccountVoucherResponseDTO>(pageData.map(this::toResponse));
    }

    private AccountVoucherResponseDTO toResponse(AccountVoucher entity) {
        AccountVoucherResponseDTO dto = new AccountVoucherResponseDTO();
        dto.setId(entity.getId());
        dto.setVoucherId(entity.getVoucher().getId());
        dto.setAccountId(entity.getUserEntity().getId());
        dto.setVoucherName(entity.getVoucher().getName());
        dto.setQuantity(entity.getQuantity());
        dto.setVoucherStatus(entity.getVoucher().getStatus().name());
        dto.setAccountName(entity.getUserEntity().getName());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

     @Override
    public List<ClientAccountVoucherDTO> getAvailablePrivateVouchersForUser(Integer userId) {
        Instant now = Instant.now();
        List<AccountVoucher> accountVouchers = accountVoucherRepository.findAvailablePrivateVouchersForUser(userId, now);

        return accountVouchers.stream().map(av -> {
            var v = av.getVoucher();
            ClientAccountVoucherDTO dto = new ClientAccountVoucherDTO();
            dto.setId(av.getId());
            dto.setVoucherId(v.getId());
            dto.setAccountId(av.getUserEntity().getId());
            dto.setVoucherCode(v.getCode());
            dto.setVoucherName(v.getName());
            dto.setVoucherType(v.getType());
            dto.setVoucherTypeUser(v.getTypeUser());
            dto.setVoucherStatus(v.getStatus());
            dto.setFixedDiscountValue(v.getFixedDiscountValue());
            dto.setPercentageDiscountValue(v.getPercentageDiscountValue());
            dto.setMaxDiscountValue(v.getMaxDiscountValue());
            dto.setMinOrderValue(v.getMinOrderValue());
            dto.setQuantity(av.getQuantity());
            dto.setStatus(av.getStatus());
            dto.setEndTime(v.getEndTime());
            dto.setCreatedAt(av.getCreatedAt());
            dto.setUpdatedAt(av.getUpdatedAt());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
public ClientAccountVoucherDTO findPrivateVoucherByUserAndCode(Integer userId, String code) {
    Instant now = Instant.now();
    AccountVoucher av = accountVoucherRepository.findPrivateVoucherByUserAndCode(userId, code, now);
    if (av == null) return null;
    return mapToClientAccountVoucherDTO(av);
}

@Override
public ClientAccountVoucherDTO validatePrivateVoucherForUser(Integer userId, String code, BigDecimal orderAmount) {
    Instant now = Instant.now();
    AccountVoucher av = accountVoucherRepository.findPrivateVoucherByUserAndCode(userId, code, now);
    if (av == null) return null;
    Voucher v = av.getVoucher();
    // Kiểm tra điều kiện áp dụng
    if (v.getMinOrderValue() != null && orderAmount.compareTo(v.getMinOrderValue()) < 0) return null;
    if (av.getQuantity() <= 0) return null;
    if (v.getStatus() != PromotionStatus.ACTIVE || v.getDeleted()) return null;
    return mapToClientAccountVoucherDTO(av);
}

// Hàm map DTO
private ClientAccountVoucherDTO mapToClientAccountVoucherDTO(AccountVoucher av) {
    Voucher v = av.getVoucher();
    ClientAccountVoucherDTO dto = new ClientAccountVoucherDTO();
    dto.setId(av.getId());
    dto.setVoucherId(v.getId());
    dto.setAccountId(av.getUserEntity().getId());
    dto.setVoucherCode(v.getCode());
    dto.setVoucherName(v.getName());
    dto.setVoucherType(v.getType());
    dto.setVoucherTypeUser(v.getTypeUser());
    dto.setVoucherStatus(v.getStatus());
    dto.setFixedDiscountValue(v.getFixedDiscountValue());
    dto.setPercentageDiscountValue(v.getPercentageDiscountValue());
    dto.setMaxDiscountValue(v.getMaxDiscountValue());
    dto.setMinOrderValue(v.getMinOrderValue());
    dto.setQuantity(av.getQuantity());
    dto.setStatus(av.getStatus());
    dto.setEndTime(v.getEndTime());
    dto.setCreatedAt(av.getCreatedAt());
    dto.setUpdatedAt(av.getUpdatedAt());
    return dto;
}
}