package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ShirtCollarDTO.ShirtCollarRequestDTO;
import com.example.datnmainpolo.dto.ShirtCollarDTO.ShirtCollarResponseDTO;

public interface ShirtCollarService {
    ShirtCollarResponseDTO create(ShirtCollarRequestDTO requestDTO);
    ShirtCollarResponseDTO update(Integer id, ShirtCollarRequestDTO requestDTO);
    void softDelete(Integer id);
    ShirtCollarResponseDTO getById(Integer id);
    PaginationResponse<ShirtCollarResponseDTO> getAll(int page, int size);
}