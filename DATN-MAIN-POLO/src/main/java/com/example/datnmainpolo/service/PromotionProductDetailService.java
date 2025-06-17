package com.example.datnmainpolo.service;



import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignPromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailRequestDTO;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponseDTO;
import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.enums.PromotionStatus;

;import java.util.List;

public interface PromotionProductDetailService {
    PromotionProductDetailResponseDTO createPromotionProductDetail(PromotionProductDetailRequestDTO requestDTO);
    PromotionProductDetailResponseDTO updatePromotionProductDetail(Integer id, PromotionProductDetailRequestDTO requestDTO);
    PromotionProductDetailResponseDTO getPromotionProductDetailById(Integer id);

    void softDeletePromotionProductDetail(Integer id);

    PaginationResponse<PromotionProductDetailResponseDTO> getAllByStatusAndDeletedFalse(PromotionStatus status, int page, int size);



}