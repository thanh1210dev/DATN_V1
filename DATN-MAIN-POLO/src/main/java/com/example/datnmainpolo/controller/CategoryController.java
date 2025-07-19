package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.CategoryDTO.CategoryRequestDTO;
import com.example.datnmainpolo.dto.CategoryDTO.CategoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.eclipse.angus.mail.handlers.multipart_mixed;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> create(
        @Valid @RequestPart("category") CategoryRequestDTO requestDTO,
        @RequestPart(value = "image", required = false) MultipartFile image
    ) {
  
        return ResponseEntity.ok(categoryService.create(requestDTO,image));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> update(
        @PathVariable Integer id,
        @Valid @RequestPart("category") CategoryRequestDTO requestDTO,
        @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return ResponseEntity.ok(categoryService.update(id, requestDTO,image));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        categoryService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(categoryService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<CategoryResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(categoryService.getAll(page, size));
    }
}
