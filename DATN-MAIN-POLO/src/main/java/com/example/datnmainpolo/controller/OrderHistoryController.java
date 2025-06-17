package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryRequestDTO;
import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.OrderHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order-history")
@RequiredArgsConstructor
public class OrderHistoryController {

    private final OrderHistoryService orderHistoryService;

    // API để tạo mới một bản ghi OrderHistory
    @PostMapping
    public ResponseEntity<OrderHistoryResponseDTO> create(@Valid @RequestBody OrderHistoryRequestDTO requestDTO) {
        OrderHistoryResponseDTO response = orderHistoryService.create(requestDTO);
        return ResponseEntity.ok(response);
    }

    // API để cập nhật thông tin OrderHistory
    @PutMapping("/{id}")
    public ResponseEntity<OrderHistoryResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody OrderHistoryRequestDTO requestDTO) {
        OrderHistoryResponseDTO response = orderHistoryService.update(id, requestDTO);
        return ResponseEntity.ok(response);
    }

    // API để thực hiện soft delete (đánh dấu xóa) một bản ghi OrderHistory
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        orderHistoryService.softDelete(id);
        return ResponseEntity.noContent().build(); // Trả về mã 204 (No Content) khi xóa thành công
    }

    // API để lấy thông tin chi tiết của một bản ghi OrderHistory
    @GetMapping("/{id}")
    public ResponseEntity<OrderHistoryResponseDTO> getById(@PathVariable Integer id) {
        OrderHistoryResponseDTO response = orderHistoryService.getById(id);
        return ResponseEntity.ok(response);
    }

    // API để lấy danh sách OrderHistory với phân trang
    @GetMapping
    public ResponseEntity<PaginationResponse<OrderHistoryResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<OrderHistoryResponseDTO> response = orderHistoryService.getAll(page, size);
        return ResponseEntity.ok(response);
    }
}
