package com.example.datnmainpolo.service;

import org.springframework.web.multipart.MultipartFile;

import com.example.datnmainpolo.dto.CategoryDTO.CategoryRequestDTO;
import com.example.datnmainpolo.dto.CategoryDTO.CategoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;

public interface CategoryService {
    CategoryResponseDTO create(CategoryRequestDTO requestDTO, MultipartFile image) ;
    CategoryResponseDTO update(Integer id, CategoryRequestDTO requestDTO, MultipartFile image);
    void softDelete(Integer id);
    CategoryResponseDTO getById(Integer id);
    PaginationResponse<CategoryResponseDTO> getAll(int page, int size);
}