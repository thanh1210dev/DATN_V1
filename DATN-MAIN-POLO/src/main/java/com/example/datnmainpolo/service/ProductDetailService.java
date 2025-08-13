
        package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailRequestDTO;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public interface ProductDetailService {
    List<ProductDetailResponseDTO> create(ProductDetailRequestDTO requestDTO);
    ProductDetailResponseDTO update(Integer id, ProductDetailRequestDTO requestDTO);
    void softDelete(Integer id);
    ProductDetailResponseDTO getById(Integer id);
    PaginationResponse<ProductDetailResponseDTO> getAll(Integer id, int page, int size);
    PaginationResponse<ProductDetailResponseDTO> getAllPage(int page, int size, String code, String name, BigDecimal price, Integer sizeId, Integer colorId);
    PaginationResponse<ProductDetailResponseDTO> getAllWithZeroPromotionalPrice(String code, String name, BigDecimal price, int page, int size);
    List<com.example.datnmainpolo.entity.Size> getAvailableSizes(Integer productId);
    List<com.example.datnmainpolo.entity.Color> getAvailableColors(Integer productId, Integer sizeId);
    ProductDetailResponseDTO getProductDetailBySizeAndColor(Integer productId, Integer sizeId, Integer colorId);
        // import / import history methods removed; pricing & history tracking disabled
        void updateProductPriceIfNeeded(Integer productDetailId, Integer quantitySold); // TODO: can be deprecated later
}
