package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bills")
public class BillController {
    private final BillService billService;

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> getBillsByStatus(
            @RequestParam(defaultValue = "PENDING") OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(billService.getAllByStatusAndDeletedFalse(status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaginationResponse<BillResponseDTO>> getBillsById(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (size <= 0) size = 10;
        return ResponseEntity.ok(billService.findAllByCustomerIdAndDeletedFalse(id, page, size));
    }

    @PostMapping
    public ResponseEntity<BillResponseDTO> createBill(@RequestBody @Valid BillRequestDTO request) {
        return ResponseEntity.ok(billService.createBillAdmin(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BillResponseDTO> updateBill(
            @PathVariable Integer id,
            @RequestBody  BillRequestDTO request
    ) {
        return ResponseEntity.ok(billService.updateBillAdmin(id, request));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Integer id) {
        billService.deleteBill(id);
        return ResponseEntity.noContent().build();
    }
}
