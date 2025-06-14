package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.MaterialDTO.MaterialRequestDTO;
import com.example.datnmainpolo.dto.MaterialDTO.MaterialResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {
    private final MaterialService materialService;

    @PostMapping
    public ResponseEntity<MaterialResponseDTO> create(@Valid @RequestBody MaterialRequestDTO requestDTO) {
        return ResponseEntity.ok(materialService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody MaterialRequestDTO requestDTO) {
        return ResponseEntity.ok(materialService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        materialService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(materialService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<MaterialResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(materialService.getAll(page, size));
    }
}