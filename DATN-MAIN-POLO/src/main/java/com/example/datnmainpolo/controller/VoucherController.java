package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherRequestDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherTypeUser;
import com.example.datnmainpolo.repository.VoucherRepository;
import com.example.datnmainpolo.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherController {

    @Autowired
    private VoucherService voucherService;
    
    @Autowired
    private VoucherRepository voucherRepository;

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
            // Use the new info method that doesn't validate minOrderValue
            VoucherResponseDTO response = voucherService.getVoucherByCodeInfo(code);
            System.out.println("SUCCESS: Found voucher with code: " + response.getCode());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("FAILED: Code '" + code + "' failed with error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/test-database")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        Map<String, Object> result = new HashMap<>();
        try {
            long count = voucherRepository.count();
            List<Voucher> allVouchers = voucherRepository.findAll();
            
            result.put("totalVouchers", count);
            result.put("vouchers", allVouchers.stream()
                .map(v -> {
                    Map<String, Object> voucherInfo = new HashMap<>();
                    voucherInfo.put("code", v.getCode());
                    voucherInfo.put("name", v.getName());
                    voucherInfo.put("status", v.getStatus());
                    voucherInfo.put("deleted", v.getDeleted());
                    voucherInfo.put("typeUser", v.getTypeUser());
                    voucherInfo.put("quantity", v.getQuantity());
                    voucherInfo.put("minOrderValue", v.getMinOrderValue() != null ? v.getMinOrderValue().toString() : "null");
                    voucherInfo.put("fixedDiscountValue", v.getFixedDiscountValue() != null ? v.getFixedDiscountValue().toString() : "null");
                    voucherInfo.put("percentageDiscountValue", v.getPercentageDiscountValue() != null ? v.getPercentageDiscountValue().toString() : "null");
                    return voucherInfo;
                })
                .toList());
            result.put("status", "success");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "failed");
            return ResponseEntity.status(500).body(result);
        }
    }
    
    @GetMapping("/test-search/{code}")
    public ResponseEntity<Map<String, Object>> testSearch(@PathVariable String code) {
        Map<String, Object> result = new HashMap<>();
        try {
            // Test flexible search
            var flexibleResult = voucherRepository.findByCodeFlexible(code);
            result.put("flexibleSearch", flexibleResult.isPresent() ? 
                Map.of("found", true, "code", flexibleResult.get().getCode()) : 
                Map.of("found", false));
            
            // Test exact search
            var exactResult = voucherRepository.findByCodeAndNotDeleted(code);
            result.put("exactSearch", exactResult.isPresent() ? 
                Map.of("found", true, "code", exactResult.get().getCode()) : 
                Map.of("found", false));
                
            result.put("searchCode", code);
            result.put("status", "success");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "failed");
            return ResponseEntity.status(500).body(result);
        }
    }
    
    @GetMapping("/test-service/{code}")
    public ResponseEntity<Map<String, Object>> testService(@PathVariable String code) {
        Map<String, Object> result = new HashMap<>();
        try {
            // Test with extremely large order amount to bypass min order validation
            VoucherResponseDTO response = voucherService.getVoucherByCodeForUser(code, null, new BigDecimal("10000000"));
            result.put("found", true);
            result.put("voucher", response);
            result.put("status", "success");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("found", false);
            result.put("error", e.getMessage());
            result.put("errorClass", e.getClass().getSimpleName());
            result.put("status", "failed");
            return ResponseEntity.ok(result);
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