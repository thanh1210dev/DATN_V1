package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.BrandDTO.BrandRequestDTO;
import com.example.datnmainpolo.dto.BrandDTO.BrandResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.BrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {
    private final BrandService brandService;

    @PostMapping
    public ResponseEntity<BrandResponseDTO> create(@Valid @RequestBody BrandRequestDTO requestDTO) {
        return ResponseEntity.ok(brandService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody BrandRequestDTO requestDTO) {
        return ResponseEntity.ok(brandService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        brandService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrandResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(brandService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<BrandResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(brandService.getAll(page, size));
    }
}