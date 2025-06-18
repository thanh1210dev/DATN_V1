package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailRequestDTO;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;
import com.example.datnmainpolo.service.ProductDetailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-details")
@RequiredArgsConstructor
public class ProductDetailController {
    private final ProductDetailService productDetailService;

    @PostMapping
    public ResponseEntity<List<ProductDetailResponseDTO> > create(@Valid @RequestBody ProductDetailRequestDTO requestDTO) {
        return ResponseEntity.ok(productDetailService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody ProductDetailRequestDTO requestDTO) {
        return ResponseEntity.ok(productDetailService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        productDetailService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(productDetailService.getById(id));
    }

    @GetMapping("/all/{id}")
    public ResponseEntity<PaginationResponse<ProductDetailResponseDTO>> getAll(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(productDetailService.getAll( id,page, size));
    }


    @GetMapping("/all")
    public ResponseEntity<PaginationResponse<ProductDetailResponseDTO>> getAllPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(productDetailService.getAllPage( page, size));
    }
}