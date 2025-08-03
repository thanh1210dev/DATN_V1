package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.CategoryDTO.CategoryRequestDTO;
import com.example.datnmainpolo.dto.CategoryDTO.CategoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.CategoryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
            @RequestParam("category") String categoryJson,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) throws JsonProcessingException {
        System.out.println("=== CATEGORY CONTROLLER DEBUG ===");
        System.out.println("POST /api/categories called");
        System.out.println("Received category JSON: " + categoryJson);

        // Parse JSON string to DTO
        ObjectMapper objectMapper = new ObjectMapper();
        CategoryRequestDTO requestDTO = objectMapper.readValue(categoryJson, CategoryRequestDTO.class);

        System.out.println("Category code: " + requestDTO.getCode());
        System.out.println("Category name: " + requestDTO.getName());
        if (image != null) {
            System.out.println("Image file name: " + image.getOriginalFilename());
            System.out.println("Image file size: " + image.getSize());
        } else {
            System.out.println("No image file received");
        }

        CategoryResponseDTO result = categoryService.create(requestDTO, image);
        System.out.println("Created category with ID: " + result.getId());
        return ResponseEntity.ok(result);
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
