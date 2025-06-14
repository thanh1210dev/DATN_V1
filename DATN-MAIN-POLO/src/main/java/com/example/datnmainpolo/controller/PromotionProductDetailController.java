package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailRequestDTO;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.service.PromotionProductDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/promotion-product-details")
public class PromotionProductDetailController {

    @Autowired
    private PromotionProductDetailService promotionProductDetailService;

    @PostMapping
    public ResponseEntity<PromotionProductDetailResponseDTO> createPromotionProductDetail(@Valid @RequestBody PromotionProductDetailRequestDTO requestDTO) {
        PromotionProductDetailResponseDTO created = promotionProductDetailService.createPromotionProductDetail(requestDTO);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public PaginationResponse<PromotionProductDetailResponseDTO> getAllByStatusAndDeletedFalse(
            @RequestParam PromotionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return promotionProductDetailService.getAllByStatusAndDeletedFalse(status, page, size);
    }


    @PutMapping("/{id}")
    public ResponseEntity<PromotionProductDetailResponseDTO> updatePromotionProductDetail(@PathVariable Integer id, @Valid @RequestBody PromotionProductDetailRequestDTO requestDTO) {
        PromotionProductDetailResponseDTO updated = promotionProductDetailService.updatePromotionProductDetail(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionProductDetailResponseDTO> getPromotionProductDetailById(@PathVariable Integer id) {
        PromotionProductDetailResponseDTO detail = promotionProductDetailService.getPromotionProductDetailById(id);
        return ResponseEntity.ok(detail);
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeletePromotionProductDetail(@PathVariable Integer id) {
        promotionProductDetailService.softDeletePromotionProductDetail(id);
        return ResponseEntity.noContent().build();
    }
}