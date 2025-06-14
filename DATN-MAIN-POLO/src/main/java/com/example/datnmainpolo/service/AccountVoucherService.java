package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.AccountVoucherDTO.AccountVoucherResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.enums.PromotionStatus;

import java.util.List;

public interface AccountVoucherService {
    PaginationResponse<AccountVoucherResponseDTO> getAllByStatusAndDeletedFalse(PromotionStatus status, int page, int size);
    void assignVoucherToUsers(Integer voucherId, List<Integer> userIds);
    PaginationResponse<AccountVoucherResponseDTO> getUsersByVoucherId(Integer voucherId, int page, int size);
    PaginationResponse<AccountVoucherResponseDTO> getVouchersByUserId(Integer userId, int page, int size);
}
