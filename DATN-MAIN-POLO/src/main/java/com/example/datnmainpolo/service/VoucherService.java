package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;

import java.time.Instant;

public interface VoucherService {
    PaginationResponse<VoucherResponseDTO> findByCodeAndStartTimeAndEndTimeAndStatus(
            String code, Instant startTime, Instant endTime, PromotionStatus status, int page, int size);

    VoucherResponseDTO createVoucher(VoucherRequestDTO requestDTO);

    VoucherResponseDTO updateVoucher(Integer id, VoucherRequestDTO requestDTO);

    VoucherResponseDTO getVoucherById(Integer id);

    void softDeleteVoucher(Integer id);

    void updateExpiredVouchers();

    void updateActiveVouchers();
}