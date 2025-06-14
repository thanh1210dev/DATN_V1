package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailRequestDTO;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;

public interface ProductDetailService {
    ProductDetailResponseDTO create(ProductDetailRequestDTO requestDTO);
    ProductDetailResponseDTO update(Integer id, ProductDetailRequestDTO requestDTO);
    void softDelete(Integer id);
    ProductDetailResponseDTO getById(Integer id);
    PaginationResponse<ProductDetailResponseDTO> getAll(int page, int size);
}