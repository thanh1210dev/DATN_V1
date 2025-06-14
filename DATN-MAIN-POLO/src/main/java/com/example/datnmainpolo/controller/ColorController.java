package com.example.datnmainpolo.controller;



import com.example.datnmainpolo.dto.ColorDTO.ColorRequestDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.ColorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/colors")
@RequiredArgsConstructor
public class ColorController {
    private final ColorService colorService;

    @PostMapping
    public ResponseEntity<ColorResponseDTO> create(@Valid @RequestBody ColorRequestDTO requestDTO) {
        return ResponseEntity.ok(colorService.create(requestDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ColorResponseDTO> update(@PathVariable Integer id, @Valid @RequestBody ColorRequestDTO requestDTO) {
        return ResponseEntity.ok(colorService.update(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Integer id) {
        colorService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ColorResponseDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(colorService.getById(id));
    }

    @GetMapping
    public ResponseEntity<PaginationResponse<ColorResponseDTO>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(colorService.getAll(page, size));
    }
}
