package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionRequestDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;

import java.time.Instant;

public interface PromotionService {
    PromotionResponseDTO createPromotion(PromotionRequestDTO requestDTO);
    PromotionResponseDTO updatePromotion(Integer id, PromotionRequestDTO requestDTO);
    PromotionResponseDTO getPromotionById(Integer id);
    PaginationResponse<PromotionResponseDTO> findByCodeAndStartTimeAndEndTimeAndStatus(
            String code, Instant startTime, Instant endTime, PromotionStatus status, int page, int size);

    void softDeletePromotion(Integer id);

    void updateExpiredPromotions();

    void updateActivePromotions();
}
