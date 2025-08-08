package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.AccountVoucherDTO.ClientAccountVoucherDTO;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.service.AccountVoucherService;
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

public class ClientVoucherController {

    @Autowired
    private AccountVoucherService accountVoucherService;

    
    // API để lấy voucher PRIVATE được phân cho user (cho checkout)
    @GetMapping("/private")
    public ResponseEntity<List<ClientAccountVoucherDTO>> getPrivateVouchersForUser(@RequestParam Integer userId) {
        List<ClientAccountVoucherDTO> vouchers = accountVoucherService.getAvailablePrivateVouchersForUser(userId);
        return ResponseEntity.ok(vouchers);
    }

    // API để lấy thông tin voucher theo code (không validation - chỉ hiển thị)
    // API mới: Tìm kiếm voucher PRIVATE theo code (chỉ hiển thị, không cần orderAmount)
    @GetMapping("/private/by-code")
    public ResponseEntity<?> getPrivateVoucherByCode(
            @RequestParam Integer userId,
            @RequestParam String code) {
        try {
            ClientAccountVoucherDTO voucher = accountVoucherService.findPrivateVoucherByUserAndCode(userId, code);
            if (voucher == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy voucher hoặc bạn không có quyền sử dụng"));
            }
            return ResponseEntity.ok(voucher);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    // API để validate voucher khi áp dụng (có validation đầy đủ)
    // API mới: Validate voucher PRIVATE (kiểm tra điều kiện, trả về thông tin nếu hợp lệ)
    @GetMapping("/private/validate")
    public ResponseEntity<?> validatePrivateVoucherForUser(
            @RequestParam Integer userId,
            @RequestParam String code,
            @RequestParam BigDecimal orderAmount) {
        try {
            ClientAccountVoucherDTO voucher = accountVoucherService.validatePrivateVoucherForUser(userId, code, orderAmount);
            if (voucher == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Voucher không hợp lệ hoặc không đủ điều kiện áp dụng"));
            }
            return ResponseEntity.ok(voucher);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}
