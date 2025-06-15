package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionRequestDTO;
import com.example.datnmainpolo.dto.PromotionDTO.PromotionResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.Instant;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionService promotionService;
    @GetMapping("/search")
    public PaginationResponse<PromotionResponseDTO> findByCodeAndStartTimeAndEndTimeAndStatus(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return promotionService.findByCodeAndStartTimeAndEndTimeAndStatus(code, startTime, endTime, status, page, size);
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
}