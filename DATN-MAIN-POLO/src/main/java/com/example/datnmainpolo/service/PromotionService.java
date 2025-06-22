package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionRequestDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionResponseDTO;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignPromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignSinglePromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponse;
import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.enums.PromotionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface PromotionService {
    PromotionResponseDTO createPromotion(PromotionRequestDTO requestDTO);
    PromotionResponseDTO updatePromotion(Integer id, PromotionRequestDTO requestDTO);
    PromotionResponseDTO getPromotionById(Integer id);
    PaginationResponse<PromotionResponseDTO> findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPrice(
            String code, String name, Instant startTime, Instant endTime, PromotionStatus status,
            BigDecimal percentageDiscountValue, int page, int size);

    void softDeletePromotion(Integer id);

    void updateExpiredPromotions();

    void updateActivePromotions();



    // phan vao dot
    void assignPromotionToProducts(AssignPromotionRequest request);
    void assignPromotionToSingleProductDetail(AssignSinglePromotionRequest request);
    PaginationResponse<PromotionProductDetailResponse> getPromotionProductsByPromotionId(Integer promotionId,int page, int size);
}
