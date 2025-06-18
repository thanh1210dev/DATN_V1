package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDetailDTO.AddProductToBillRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.service.BillDetailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bill-details")
@RequiredArgsConstructor
public class BillDetailController {
    private final BillDetailService billDetailService;

    @GetMapping("/{billId}")
    public ResponseEntity<PaginationResponse<BillDetailResponseDTO>> getBillDetailsByBillId(
            @PathVariable Integer billId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(billDetailService.getBillDetailsByBillId(billId, page, size));
    }

    @PostMapping("/{billId}")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillDetailResponseDTO> createBillDetail(
            @PathVariable Integer billId,
            @RequestBody BillDetailCreateDTO request) {
        return ResponseEntity.ok(billDetailService.createBillDetail(billId, request));
    }

    @PostMapping("/{billId}/product")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillDetailResponseDTO> addProductToBill(
            @PathVariable Integer billId,
            @RequestBody AddProductToBillRequestDTO request) {
        return ResponseEntity.ok(billDetailService.addProductToBill(billId, request.getProductDetailId()));
    }

    @PutMapping("/{billDetailId}/quantity")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillDetailResponseDTO> updateQuantity(
            @PathVariable Integer billDetailId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(billDetailService.updateQuantity(billDetailId, quantity));
    }

    @DeleteMapping("/{billDetailId}")
    // @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Void> deleteBillDetail(@PathVariable Integer billDetailId) {
        billDetailService.deleteBillDetail(billDetailId);
        return ResponseEntity.ok().build();
    }
}
