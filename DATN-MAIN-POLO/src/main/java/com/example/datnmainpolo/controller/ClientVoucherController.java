package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.service.VoucherService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/client/vouchers")
@CrossOrigin(origins = "*")
public class ClientVoucherController {

    @Autowired
    private VoucherService voucherService;

    // API để lấy voucher có thể sử dụng cho khách hàng (cả PUBLIC và PRIVATE)
    @GetMapping("/available")
    public ResponseEntity<List<VoucherResponseDTO>> getAvailableVouchers(
            @RequestParam Integer userId,
            @RequestParam BigDecimal orderAmount) {
        List<VoucherResponseDTO> response = voucherService.getAvailableVouchersForUser(userId, orderAmount);
        return ResponseEntity.ok(response);
    }
    
    // API để lấy voucher PRIVATE được phân cho user (cho checkout)
    @GetMapping("/private")
    public ResponseEntity<List<VoucherResponseDTO>> getPrivateVouchers(
            @RequestParam Integer userId,
            @RequestParam BigDecimal orderAmount) {
        List<VoucherResponseDTO> response = voucherService.getPrivateVouchersForUser(userId, orderAmount);
        return ResponseEntity.ok(response);
    }

    // API để lấy voucher theo code cho khách hàng
    @GetMapping("/by-code/{code}")
    public ResponseEntity<?> getVoucherByCode(
            @PathVariable String code,
            @RequestParam Integer userId,
            @RequestParam BigDecimal orderAmount) {
        System.out.println("=== DEBUG USER INFO ===");
        System.out.println("Received userId: " + userId);
        System.out.println("Voucher code: " + code);
        System.out.println("Order amount: " + orderAmount);
        System.out.println("========================");
        
        try {
            VoucherResponseDTO response = voucherService.getVoucherByCodeForUser(code, userId, orderAmount);
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}
