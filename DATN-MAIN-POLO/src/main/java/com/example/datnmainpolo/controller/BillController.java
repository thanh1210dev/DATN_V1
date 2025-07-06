package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.CustomerRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.DeliveryBillAddressRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.Impl.BillServiceImpl.DeliveryBillService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeParseException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;
    private final DeliveryBillService deliveryBillService;
    private final BillDetailService billDetailService;

    @PostMapping("/counter-sale")
    public ResponseEntity<BillResponseDTO> createCounterSale() {
        return ResponseEntity.ok(billService.counterSale());
    }

    @PostMapping("/delivery-sale")
    public ResponseEntity<BillResponseDTO> createDeliverySale(@Valid @RequestBody DeliveryBillAddressRequestDTO request) {
        return ResponseEntity.ok(deliveryBillService.createDeliveryBill(request));
    }

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> searchBills(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(billService.searchBills(code, status, page, size));
    }

    @GetMapping("/search-advanced")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> searchBillsAdvanced(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        Instant start = null;
        Instant end = null;
        try {
            start = (startDate != null && !startDate.isEmpty()) ? Instant.parse(startDate) : null;
            end = (endDate != null && !endDate.isEmpty()) ? Instant.parse(endDate) : null;
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ: " + e.getMessage());
        }
        return ResponseEntity.ok(billService.searchBillsAdvanced(code, status, start, end, minPrice, maxPrice, page, size));
    }

    @PostMapping("/{billId}/voucher")
    public ResponseEntity<BillResponseDTO> addVoucherToBill(
            @PathVariable Integer billId,
            @RequestParam String voucherCode) {
        return ResponseEntity.ok(billService.addVoucherToBill(billId, voucherCode));
    }

    @PutMapping("/{billId}/status")
    public ResponseEntity<BillResponseDTO> updateBillStatus(
            @PathVariable Integer billId,
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(billService.updateBillStatus(billId, status));
    }

    @PostMapping("/{billId}/payment")
    public ResponseEntity<PaymentResponseDTO> processPayment(
            @PathVariable Integer billId,
            @RequestParam PaymentType paymentType,
            @RequestParam(required = false) BigDecimal amount) {
        return ResponseEntity.ok(billService.processPayment(billId, paymentType, amount));
    }

    @PostMapping("/{billId}/confirm-banking")
    public ResponseEntity<BillResponseDTO> confirmBankingPayment(
            @PathVariable Integer billId) {
        return ResponseEntity.ok(billService.confirmBankingPayment(billId));
    }

    @GetMapping("/{billId}/print")
    public ResponseEntity<String> printInvoice(@PathVariable Integer billId) {
        return ResponseEntity.ok(billService.generateInvoice(billId));
    }

    @GetMapping("/{billId}")
    public ResponseEntity<BillResponseDTO> getBillDetail(@PathVariable Integer billId) {
        return ResponseEntity.ok(billService.getDetail(billId));
    }

    @GetMapping("/{billId}/details")
    public ResponseEntity<PaginationResponse<BillDetailResponseDTO>> getBillDetails(
            @PathVariable Integer billId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(billDetailService.getBillDetailsByBillId(billId, page, size));
    }

    @PostMapping("/{billId}/assign-customer")
    public ResponseEntity<BillResponseDTO> addLoyalCustomerToBill(@PathVariable Integer billId, @RequestParam Integer customerId) {
        return ResponseEntity.ok(billService.addLoyalCustomerToBill(billId, customerId));
    }

    @PostMapping("/{billId}/visiting-guests")
    public ResponseEntity<BillResponseDTO> addVisitingGuestsToBill(
            @PathVariable Integer billId,
            @Valid @RequestBody CustomerRequestDTO requestDTO) {
        return ResponseEntity.ok(billService.addVisitingGuests(billId, requestDTO));
    }

    @PostMapping("/{billId}/add-user")
    public ResponseEntity<BillResponseDTO> addUserToBill(
            @PathVariable Integer billId,
            @Valid @RequestBody UserRequestDTO userRequestDTO) {
        return ResponseEntity.ok(billService.addUserToBill(billId, userRequestDTO));
    }
}