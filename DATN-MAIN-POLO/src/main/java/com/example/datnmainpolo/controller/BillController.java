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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeParseException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bills")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowCredentials = "true")
public class BillController {

    private static final Logger LOGGER = LoggerFactory.getLogger(BillController.class);

    private final BillService billService;
    private final DeliveryBillService deliveryBillService;
    private final BillDetailService billDetailService;

    @PostMapping("/counter-sale")
    public ResponseEntity<BillResponseDTO> createCounterSale() {
        LOGGER.info("Creating counter sale bill");
        return ResponseEntity.ok(billService.counterSale());
    }

    @PostMapping("/delivery-sale")
    public ResponseEntity<BillResponseDTO> createDeliverySale(@Valid @RequestBody DeliveryBillAddressRequestDTO request) {
        LOGGER.info("Creating delivery sale bill");
        return ResponseEntity.ok(deliveryBillService.createDeliveryBill(request));
    }

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> searchBills(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        LOGGER.info("Searching bills with code: {}, status: {}, page: {}, size: {}", code, status, page, size);
        return ResponseEntity.ok(billService.searchBills(code, status, page, size));
    }

    @GetMapping("/search-advanced")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> searchBillsAdvanced(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        LOGGER.info("Advanced search bills with code: {}, status: {}, phoneNumber: {}, startDate: {}, endDate: {}, minPrice: {}, maxPrice: {}, page: {}, size: {}",
                code, status, phoneNumber, startDate, endDate, minPrice, maxPrice, page, size);
        Instant start = null;
        Instant end = null;
        try {
            start = (startDate != null && !startDate.isEmpty()) ? Instant.parse(startDate) : null;
            end = (endDate != null && !endDate.isEmpty()) ? Instant.parse(endDate) : null;
        } catch (DateTimeParseException e) {
            LOGGER.error("Invalid date format: {}", e.getMessage());
            throw new IllegalArgumentException("Định dạng ngày không hợp lệ: " + e.getMessage());
        }
        return ResponseEntity.ok(billService.searchBillsAdvanced(code, status, phoneNumber, start, end, minPrice, maxPrice, page, size));
    }

    @PostMapping("/{billId}/voucher")
    public ResponseEntity<BillResponseDTO> addVoucherToBill(
            @PathVariable Integer billId,
            @RequestParam String voucherCode) {
        LOGGER.info("Adding voucher {} to bill {}", voucherCode, billId);
        return ResponseEntity.ok(billService.addVoucherToBill(billId, voucherCode));
    }

    @DeleteMapping("/{billId}/voucher")
    public ResponseEntity<BillResponseDTO> removeVoucherFromBill(@PathVariable Integer billId) {
        LOGGER.info("Removing voucher from bill {}", billId);
        return ResponseEntity.ok(billService.removeVoucherFromBill(billId));
    }

    @PutMapping("/{billId}/status")
    public ResponseEntity<BillResponseDTO> updateBillStatus(
            @PathVariable Integer billId,
            @RequestParam OrderStatus status) {
        try {
            LOGGER.info("🔄 API Request: Updating bill {} status to {}", billId, status);
            LOGGER.info("🔄 Request received at: {}", java.time.Instant.now());
            LOGGER.info("🔄 Request parameters - billId: {}, status: {}", billId, status);
            
            BillResponseDTO result = billService.updateBillStatus(billId, status);
            
            LOGGER.info("✅ API Response: Bill status updated successfully");
            LOGGER.info("✅ Response data: {}", result != null ? result.getStatus() : "null");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            LOGGER.error("❌ API Error: Failed to update bill {} status: {}", billId, e.getMessage(), e);
            LOGGER.error("❌ Full stack trace: ", e);
            throw e;
        }
    }

    @PostMapping("/{billId}/payment")
    public ResponseEntity<PaymentResponseDTO> processPayment(
            @PathVariable Integer billId,
            @RequestParam PaymentType paymentType,
            @RequestParam(required = false) BigDecimal amount) {
        LOGGER.info("Processing payment for bill {} with type {}", billId, paymentType);
        return ResponseEntity.ok(billService.processPayment(billId, paymentType, amount));
    }

    @PostMapping("/{billId}/confirm-banking")
    public ResponseEntity<BillResponseDTO> confirmBankingPayment(
            @PathVariable Integer billId) {
        LOGGER.info("Confirming banking payment for bill {}", billId);
        return ResponseEntity.ok(billService.confirmBankingPayment(billId));
    }

    @GetMapping("/{billId}/print")
    public ResponseEntity<String> printInvoice(@PathVariable Integer billId) {
        LOGGER.info("Generating invoice PDF for bill {}", billId);
        try {
            String invoicePDF = billService.generateInvoice(billId);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .body(invoicePDF);
        } catch (RuntimeException e) {
            LOGGER.error("Error generating invoice for bill {}: {}", billId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi khi tạo hóa đơn: " + e.getMessage());
        }
    }

    @GetMapping("/{billId}")
    public ResponseEntity<BillResponseDTO> getBillDetail(@PathVariable Integer billId) {
        LOGGER.info("Fetching details for bill {}", billId);
        return ResponseEntity.ok(billService.getDetail(billId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> getCustomerBills(
            @PathVariable Integer customerId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        LOGGER.info("Fetching bills for customer {} with status: {}, page: {}, size: {}", customerId, status, page, size);
        return ResponseEntity.ok(billService.getCustomerBills(customerId, status, page, size));
    }

    @GetMapping("/{billId}/details")
    public ResponseEntity<PaginationResponse<BillDetailResponseDTO>> getBillDetails(
            @PathVariable Integer billId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        LOGGER.info("Fetching bill details for bill {} with page: {}, size: {}", billId, page, size);
        return ResponseEntity.ok(billDetailService.getBillDetailsByBillId(billId, page, size));
    }

    @PostMapping("/{billId}/assign-customer")
    public ResponseEntity<BillResponseDTO> addLoyalCustomerToBill(@PathVariable Integer billId, @RequestParam Integer customerId) {
        LOGGER.info("Assigning customer {} to bill {}", customerId, billId);
        return ResponseEntity.ok(billService.addLoyalCustomerToBill(billId, customerId));
    }

    @PostMapping("/{billId}/visiting-guests")
    public ResponseEntity<BillResponseDTO> addVisitingGuestsToBill(
            @PathVariable Integer billId,
            @Valid @RequestBody CustomerRequestDTO requestDTO) {
        LOGGER.info("Adding visiting guest to bill {}", billId);
        return ResponseEntity.ok(billService.addVisitingGuests(billId, requestDTO));
    }

    @PostMapping("/{billId}/add-user")
    public ResponseEntity<BillResponseDTO> addUserToBill(
            @PathVariable Integer billId,
            @Valid @RequestBody UserRequestDTO userRequestDTO) {
        LOGGER.info("Adding user to bill {}", billId);
        return ResponseEntity.ok(billService.addUserToBill(billId, userRequestDTO));
    }
}