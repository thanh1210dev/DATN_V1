package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.AddProductToBillRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    @PostMapping("/counter-sale")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillResponseDTO> createCounterSale() {
        return ResponseEntity.ok(billService.counterSale());
    }

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> searchBills(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(billService.searchBills(code, status, page, size));
    }

    @PostMapping("/{billId}/voucher")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillResponseDTO> addVoucherToBill(
            @PathVariable Integer billId,
            @RequestParam String voucherCode) {
        return ResponseEntity.ok(billService.addVoucherToBill(billId, voucherCode));
    }

    @PutMapping("/{billId}/status")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillResponseDTO> updateBillStatus(
            @PathVariable Integer billId,
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(billService.updateBillStatus(billId, status));
    }

    @PostMapping("/{billId}/payment")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponseDTO> processPayment(
            @PathVariable Integer billId,
            @RequestParam PaymentType paymentType,
            @RequestParam(required = false) BigDecimal amount) {
        return ResponseEntity.ok(billService.processPayment(billId, paymentType, amount));
    }

    @PostMapping("/{billId}/confirm-banking")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillResponseDTO> confirmBankingPayment(
            @PathVariable Integer billId) {
        return ResponseEntity.ok(billService.confirmBankingPayment(billId));
    }
}
