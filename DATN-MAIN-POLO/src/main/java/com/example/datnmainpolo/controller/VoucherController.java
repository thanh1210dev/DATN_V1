package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherTypeUser;
import com.example.datnmainpolo.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherController {

    @Autowired
    private VoucherService voucherService;

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<VoucherResponseDTO>> searchVouchers(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(required = false) BigDecimal percentageDiscountValue,
            @RequestParam(required = false) BigDecimal fixedDiscountValue,
            @RequestParam(required = false) BigDecimal maxDiscountValue,
            @RequestParam(required = false) VoucherTypeUser typeUser, // New parameter
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        PaginationResponse<VoucherResponseDTO> response = voucherService.findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPriceAndTypeUser(
                code, name, startTime, endTime, status, percentageDiscountValue, fixedDiscountValue, maxDiscountValue, typeUser, page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<VoucherResponseDTO> createVoucher(@RequestBody VoucherRequestDTO requestDTO) {
        VoucherResponseDTO response = voucherService.createVoucher(requestDTO);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VoucherResponseDTO> updateVoucher(
            @PathVariable Integer id, @RequestBody VoucherRequestDTO requestDTO) {
        VoucherResponseDTO response = voucherService.updateVoucher(id, requestDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Integer id) {
        voucherService.softDeleteVoucher(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<VoucherResponseDTO> getVoucherById(@PathVariable Integer id) {
        VoucherResponseDTO response = voucherService.getVoucherById(id);
        return ResponseEntity.ok(response);
    }
}