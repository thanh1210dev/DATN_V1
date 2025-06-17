package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDTO.ProductRequestDTO;
import com.example.datnmainpolo.dto.ProductDTO.ProductResponseDTO;

public interface ProductService {
    ProductResponseDTO create(ProductRequestDTO requestDTO);
    ProductResponseDTO update(Integer id, ProductRequestDTO requestDTO);
    void softDelete(Integer id);
    ProductResponseDTO getById(Integer id);
    PaginationResponse<ProductResponseDTO> getAll(int page, int size, String code, String name, Integer materialId, Integer brandId, Integer categoryId);
}