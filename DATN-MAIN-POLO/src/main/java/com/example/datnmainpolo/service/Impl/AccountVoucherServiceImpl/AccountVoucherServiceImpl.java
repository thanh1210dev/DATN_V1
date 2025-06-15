package com.example.datnmainpolo.service.Impl.AccountVoucherServiceImpl;



import com.example.datnmainpolo.dto.AccountVoucherDTO.AccountVoucherResponseDTO;
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
import java.time.Instant;
import java.util.List;

@Service
public class AccountVoucherServiceImpl implements AccountVoucherService {

    private final AccountVoucherRepository accountVoucherRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final com.example.datnmainpolo.service.Impl.Email.EmailService emailService;

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
    public void assignVoucherToUsers(Integer voucherId, List<Integer> userIds) {
        Voucher voucher = voucherRepository.findByIdAndDeletedFalse(voucherId)
                .orElseThrow(() -> new EntityNotFoundException("Voucher không tồn tại"));

        if (voucher.getStatus() != PromotionStatus.COMING_SOON && voucher.getStatus() != PromotionStatus.ACTIVE) {
            throw new IllegalArgumentException("Chỉ có thể gán voucher ở trạng thái sắp ra mắt hoặc Đang hoạt động");
        }

        for (Integer userId : userIds) {
            UserEntity user = userRepository.findByIdAndDeletedFalse(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Người dùng không tồn tại với ID: " + userId));

            if (accountVoucherRepository.existsByVoucherIdAndUserEntityIdAndDeletedFalse(voucherId, userId)) {
                continue;
            }

            AccountVoucher accountVoucher = new AccountVoucher();
            accountVoucher.setVoucher(voucher);
            accountVoucher.setUserEntity(user);
            accountVoucher.setStatus(true);
            accountVoucher.setCreatedAt(Instant.now());
            accountVoucher.setUpdatedAt(Instant.now());
            accountVoucher.setDeleted(false);

            accountVoucherRepository.save(accountVoucher);

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
        return new PaginationResponse(pageData.map(this::toResponse));
    }


    private AccountVoucherResponseDTO toResponse(AccountVoucher entity) {
        AccountVoucherResponseDTO dto = new AccountVoucherResponseDTO();
        dto.setId(entity.getId());
        dto.setVoucherId(entity.getVoucher().getId());
        dto.setAccountId(entity.getUserEntity().getId());
        dto.setVoucherName(entity.getVoucher().getName());
        dto.setVoucherStatus(entity.getVoucher().getStatus().name());
        dto.setAccountName(entity.getUserEntity().getName());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}