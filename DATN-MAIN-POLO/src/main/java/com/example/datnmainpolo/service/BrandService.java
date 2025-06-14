package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.BrandDTO.BrandRequestDTO;
import com.example.datnmainpolo.dto.BrandDTO.BrandResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;

public interface BrandService {
    BrandResponseDTO create(BrandRequestDTO requestDTO);
    BrandResponseDTO update(Integer id, BrandRequestDTO requestDTO);
    void softDelete(Integer id);
    BrandResponseDTO getById(Integer id);
    PaginationResponse<BrandResponseDTO> getAll(int page, int size);
}
