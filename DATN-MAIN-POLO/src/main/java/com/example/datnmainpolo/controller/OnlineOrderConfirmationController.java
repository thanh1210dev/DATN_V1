package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.DeliveryBillAddressRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryResponseDTO;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.service.OnlineOrderConfirmationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/online-orders")
@RequiredArgsConstructor
public class OnlineOrderConfirmationController {
    private static final Logger LOGGER = LoggerFactory.getLogger(OnlineOrderConfirmationController.class);

    private final OnlineOrderConfirmationService onlineOrderConfirmationService;

    @PostMapping("/{billId}/confirm")
    public ResponseEntity<BillResponseDTO> confirmOrder(@PathVariable Integer billId) {
        LOGGER.info("Received request to confirm order for bill ID: {}", billId);
        BillResponseDTO response = onlineOrderConfirmationService.confirmOrder(billId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{billId}/products")
    public ResponseEntity<BillResponseDTO> addProductToConfirmingOrder(
            @PathVariable Integer billId,
            @Valid @RequestBody BillDetailCreateDTO request) {
        LOGGER.info("Received request to add product to bill ID: {}", billId);
        BillResponseDTO response = onlineOrderConfirmationService.addProductToConfirmingOrder(billId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/products/{billDetailId}")
    public ResponseEntity<Void> removeProductFromConfirmingOrder(@PathVariable Integer billDetailId) {
        LOGGER.info("Received request to remove product with bill detail ID: {}", billDetailId);
        onlineOrderConfirmationService.removeProductFromConfirmingOrder(billDetailId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{billId}/status")
    public ResponseEntity<BillResponseDTO> updateOrderStatus(
            @PathVariable Integer billId,
            @RequestParam OrderStatus newStatus) {
        LOGGER.info("Received request to update status for bill ID: {} to {}", billId, newStatus);
        BillResponseDTO response = onlineOrderConfirmationService.updateOrderStatus(billId, newStatus);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{billId}/revert-status")
    public ResponseEntity<BillResponseDTO> revertOrderStatus(@PathVariable Integer billId) {
        LOGGER.info("Received request to revert status for bill ID: {}", billId);
        BillResponseDTO response = onlineOrderConfirmationService.revertOrderStatus(billId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{billId}/cod-payment")
    public ResponseEntity<BillResponseDTO> updateCODPaymentAmount(
            @PathVariable Integer billId,
            @RequestParam BigDecimal amount) {
        LOGGER.info("Received request to update COD payment amount for bill ID: {} to {}", billId, amount);
        BillResponseDTO response = onlineOrderConfirmationService.updateCODPaymentAmount(billId, amount);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{billId}/customer-payment")
    public ResponseEntity<BillResponseDTO> updateCustomerPayment(
            @PathVariable Integer billId,
            @RequestParam BigDecimal amount) {
        LOGGER.info("Received request to update customer payment for bill ID: {} to {}", billId, amount);
        BillResponseDTO response = onlineOrderConfirmationService.updateCustomerPayment(billId, amount);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{billId}/address")
    public ResponseEntity<BillResponseDTO> updateBillAddress(
            @PathVariable Integer billId,
            @Valid @RequestBody DeliveryBillAddressRequestDTO request) {
        LOGGER.info("Received request to update address for bill ID: {}", billId);
        BillResponseDTO response = onlineOrderConfirmationService.updateBillAddress(billId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{billId}/history")
    public ResponseEntity<List<OrderHistoryResponseDTO>> getOrderHistory(@PathVariable Integer billId) {
        LOGGER.info("Received request to get order history for bill ID: {}", billId);
        List<OrderHistoryResponseDTO> history = onlineOrderConfirmationService.getOrderHistory(billId);
        return ResponseEntity.ok(history);
    }
}