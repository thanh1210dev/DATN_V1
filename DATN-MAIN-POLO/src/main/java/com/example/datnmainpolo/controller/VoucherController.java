package com.example.datnmainpolo.controller;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherController {

    @Autowired
    private VoucherService voucherService;

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<VoucherResponseDTO>> searchVouchers(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) Instant startTime,
            @RequestParam(required = false) Instant endTime,
            @RequestParam(required = false) PromotionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<VoucherResponseDTO> response = voucherService.findByCodeAndStartTimeAndEndTimeAndStatus(
                code, startTime, endTime, status, page, size);
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