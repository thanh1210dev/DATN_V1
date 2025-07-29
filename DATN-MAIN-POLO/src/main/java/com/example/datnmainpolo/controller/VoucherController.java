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
        try {
            System.out.println("=== CREATE VOUCHER DEBUG ===");
            System.out.println("Request DTO: " + requestDTO);
            VoucherResponseDTO response = voucherService.createVoucher(requestDTO);
            System.out.println("Created voucher with ID: " + response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error creating voucher: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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

    @GetMapping("/by-code/{code}")
    public ResponseEntity<VoucherResponseDTO> getVoucherByCode(@PathVariable String code) {
        System.out.println("=== VOUCHER BY CODE DEBUG ===");
        System.out.println("Received code: [" + code + "] (length: " + code.length() + ")");
        
        try {
            // Try with original code first
            VoucherResponseDTO response;
            try {
                System.out.println("Trying with original code: " + code);
                response = voucherService.getVoucherByCodeForUser(code, null, BigDecimal.ZERO);
                System.out.println("Found voucher with original code: " + response.getCode());
            } catch (Exception e) {
                System.out.println("Original code failed: " + e.getMessage());
                // If original code fails and doesn't start with "null", try with "null" prefix
                if (!code.startsWith("null")) {
                    String nullPrefixCode = "null" + code;
                    System.out.println("Trying with null prefix: " + nullPrefixCode);
                    response = voucherService.getVoucherByCodeForUser(nullPrefixCode, null, BigDecimal.ZERO);
                    System.out.println("Found voucher with null prefix: " + response.getCode());
                } else {
                    System.out.println("Code already starts with null, throwing exception");
                    throw e;
                }
            }
            System.out.println("Returning successful response for voucher: " + response.getCode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("All attempts failed, returning 404: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/update-status")
    public ResponseEntity<String> triggerStatusUpdate() {
        try {
            voucherService.updateActiveVouchers();
            voucherService.updateExpiredVouchers();
            return ResponseEntity.ok("Voucher status updated successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating voucher status: " + e.getMessage());
        }
    }
}