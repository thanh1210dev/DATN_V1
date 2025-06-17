package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailRequestDTO;
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

    @PostMapping
    public ResponseEntity<?> createAdmin(@Valid @RequestBody BillDetailRequestDTO requestDTO) {
        return ResponseEntity.ok(billDetailService.createAdmin(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdmin(@PathVariable int id, @Valid @RequestBody BillDetailRequestDTO requestDTO) {
        return ResponseEntity.ok(billDetailService.updateAdmin(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable int id) {
        billDetailService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable int id) {
        return ResponseEntity.ok(billDetailService.getById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<PaginationResponse<BillDetailResponseDTO>> getAllBillDetailsByStatusAdmin(
            @RequestParam(defaultValue = "PENDING") BillDetailStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(billDetailService.getAllBillDetailByStatusAdmin(status, page, size));
    }
}
