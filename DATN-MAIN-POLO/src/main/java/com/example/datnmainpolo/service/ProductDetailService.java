package com.example.datnmainpolo.service;




import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailRequestDTO;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;

import java.util.List;

public interface ProductDetailService {
    List<ProductDetailResponseDTO> create(ProductDetailRequestDTO requestDTO);

    ProductDetailResponseDTO update(Integer id, ProductDetailRequestDTO requestDTO);

    void softDelete(Integer id);

    ProductDetailResponseDTO getById(Integer id);

    PaginationResponse<ProductDetailResponseDTO> getAll(Integer productId, int page, int size);
}