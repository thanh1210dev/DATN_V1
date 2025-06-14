package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.SizeDTO.SizeRequestDTO;
import com.example.datnmainpolo.dto.SizeDTO.SizeResponseDTO;
import com.example.datnmainpolo.service.SizeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sizes")
@RequiredArgsConstructor
public class SizeController {
    private final SizeService sizeService;

    @PostMapping
    public ResponseEntity<SizeResponseDTO> create(@Valid @RequestBody SizeRequestDTO requestDTO) {
        return ResponseEntity.ok(sizeService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SizeResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody SizeRequestDTO requestDTO) {
        return ResponseEntity.ok(sizeService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        sizeService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SizeResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(sizeService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<SizeResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(sizeService.getAll(page, size));
    }
}