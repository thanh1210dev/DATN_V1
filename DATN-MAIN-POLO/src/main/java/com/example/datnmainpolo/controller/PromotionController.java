package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionRequestDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionResponseDTO;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignPromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.AssignSinglePromotionRequest;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponse;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionService promotionService;
    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<PromotionResponseDTO>> searchPromotions(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(required = false) BigDecimal percentageDiscountValue,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        PaginationResponse<PromotionResponseDTO> response = promotionService.findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPrice(
                code, name, startTime, endTime, status, percentageDiscountValue, page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PromotionResponseDTO> createPromotion(@Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionResponseDTO created = promotionService.createPromotion(requestDTO);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> updatePromotion(@PathVariable Integer id, @Valid @RequestBody PromotionRequestDTO requestDTO) {
        PromotionResponseDTO updated = promotionService.updatePromotion(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromotionResponseDTO> getPromotionById(@PathVariable Integer id) {
        PromotionResponseDTO promotion = promotionService.getPromotionById(id);
        return ResponseEntity.ok(promotion);
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeletePromotion(@PathVariable Integer id) {
        promotionService.softDeletePromotion(id);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/assign")
    public ResponseEntity<String> assignPromotion(@RequestBody AssignPromotionRequest request) {
        promotionService.assignPromotionToProducts(request);
        return ResponseEntity.ok("Khuyến mãi đã được phân thành công");
    }

    @PostMapping("/assign-single")
    public ResponseEntity<String> assignSinglePromotion(@RequestBody AssignSinglePromotionRequest request) {
        promotionService.assignPromotionToSingleProductDetail(request);
        return ResponseEntity.ok("Khuyến mãi đã được phân cho chi tiết sản phẩm thành công");
    }

    @GetMapping("/{promotionId}/products")
    public ResponseEntity<PaginationResponse<PromotionProductDetailResponse>> getPromotionProducts(
            @PathVariable Integer promotionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        PaginationResponse<PromotionProductDetailResponse> response = promotionService.getPromotionProductsByPromotionId(promotionId, page, size);
        return ResponseEntity.ok(response);
    }
}