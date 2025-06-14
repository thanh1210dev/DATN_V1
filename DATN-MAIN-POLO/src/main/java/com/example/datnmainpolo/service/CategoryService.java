package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.CategoryDTO.CategoryRequestDTO;
import com.example.datnmainpolo.dto.CategoryDTO.CategoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;

public interface CategoryService {
    CategoryResponseDTO create(CategoryRequestDTO requestDTO);
    CategoryResponseDTO update(Integer id, CategoryRequestDTO requestDTO);
    void softDelete(Integer id);
    CategoryResponseDTO getById(Integer id);
    PaginationResponse<CategoryResponseDTO> getAll(int page, int size);
}