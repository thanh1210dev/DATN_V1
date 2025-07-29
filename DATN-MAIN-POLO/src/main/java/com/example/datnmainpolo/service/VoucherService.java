package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherTypeUser;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface VoucherService {
    PaginationResponse<VoucherResponseDTO> findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPriceAndTypeUser(
            String code, String name, Instant startTime, Instant endTime, PromotionStatus status,
            BigDecimal percentageDiscountValue, BigDecimal fixedDiscountValue, BigDecimal maxDiscountValue,
            VoucherTypeUser typeUser, // New parameter
            int page, int size);

    VoucherResponseDTO createVoucher(VoucherRequestDTO requestDTO);

    VoucherResponseDTO updateVoucher(Integer id, VoucherRequestDTO requestDTO);

    VoucherResponseDTO getVoucherById(Integer id);

    void softDeleteVoucher(Integer id);

    void updateExpiredVouchers();

    void updateActiveVouchers();

    // Methods for client API
    List<VoucherResponseDTO> getAvailableVouchersForUser(Integer userId, BigDecimal orderAmount);
    
    // Method for client checkout - only PRIVATE vouchers assigned to user
    List<VoucherResponseDTO> getPrivateVouchersForUser(Integer userId, BigDecimal orderAmount);

    VoucherResponseDTO getVoucherByCodeForUser(String code, Integer userId, BigDecimal orderAmount);
    
    // Method to get voucher info by code without validation (for display purposes)
    VoucherResponseDTO getVoucherByCodeInfo(String code);
}