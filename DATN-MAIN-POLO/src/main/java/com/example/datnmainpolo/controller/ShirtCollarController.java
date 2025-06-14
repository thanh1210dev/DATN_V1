package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ShirtCollarDTO.ShirtCollarRequestDTO;
import com.example.datnmainpolo.dto.ShirtCollarDTO.ShirtCollarResponseDTO;
import com.example.datnmainpolo.service.ShirtCollarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shirt-collars")
@RequiredArgsConstructor
public class ShirtCollarController {
    private final ShirtCollarService shirtCollarService;

    @PostMapping
    public ResponseEntity<ShirtCollarResponseDTO> create(@Valid @RequestBody ShirtCollarRequestDTO requestDTO) {
        return ResponseEntity.ok(shirtCollarService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShirtCollarResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody ShirtCollarRequestDTO requestDTO) {
        return ResponseEntity.ok(shirtCollarService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        shirtCollarService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShirtCollarResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(shirtCollarService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<ShirtCollarResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(shirtCollarService.getAll(page, size));
    }
}