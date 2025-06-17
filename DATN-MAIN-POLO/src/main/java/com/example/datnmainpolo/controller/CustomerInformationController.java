package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.CustomerInformationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer-information")
@RequiredArgsConstructor
public class CustomerInformationController {

    private final CustomerInformationService customerInformationService;

    // Tạo mới thông tin khách hàng
    @PostMapping
    public ResponseEntity<CustomerInformationResponseDTO> create(@Valid @RequestBody CustomerInformationRequestDTO requestDTO) {
        return ResponseEntity.ok(customerInformationService.create(requestDTO));
    }

    // Cập nhật thông tin khách hàng
    @PutMapping("/{id}")
    public ResponseEntity<CustomerInformationResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody CustomerInformationRequestDTO requestDTO) {
        return ResponseEntity.ok(customerInformationService.update(id, requestDTO));
    }

    // Xóa thông tin khách hàng (soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        customerInformationService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    // Lấy thông tin khách hàng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<CustomerInformationResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(customerInformationService.getById(id));
    }

    // Lấy tất cả thông tin khách hàng với phân trang
    @GetMapping
    public ResponseEntity<PaginationResponse<CustomerInformationResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(customerInformationService.getAll(page, size));
    }
}
