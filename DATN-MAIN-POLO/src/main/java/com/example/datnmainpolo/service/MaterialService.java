package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.MaterialDTO.MaterialRequestDTO;
import com.example.datnmainpolo.dto.MaterialDTO.MaterialResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;

public interface MaterialService {
    MaterialResponseDTO create(MaterialRequestDTO requestDTO);
    MaterialResponseDTO update(Integer id, MaterialRequestDTO requestDTO);
    void softDelete(Integer id);
    MaterialResponseDTO getById(Integer id);
    PaginationResponse<MaterialResponseDTO> getAll(int page, int size);
}