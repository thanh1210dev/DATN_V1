package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.SizeDTO.SizeRequestDTO;
import com.example.datnmainpolo.dto.SizeDTO.SizeResponseDTO;

public interface SizeService {
    SizeResponseDTO create(
            SizeRequestDTO requestDTO);
    SizeResponseDTO update(Integer id,
                           SizeRequestDTO requestDTO);
    void softDelete(Integer id);
    SizeResponseDTO getById(Integer id);
    PaginationResponse<SizeResponseDTO> getAll(int page,
                                               int size);
}