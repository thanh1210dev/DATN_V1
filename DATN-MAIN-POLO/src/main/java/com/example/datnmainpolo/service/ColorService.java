package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.ColorDTO.ColorRequestDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;

public interface ColorService {
    ColorResponseDTO create(ColorRequestDTO requestDTO);
    ColorResponseDTO update(Integer id, ColorRequestDTO requestDTO);
    void softDelete(Integer id);
    ColorResponseDTO getById(Integer id);
    PaginationResponse<ColorResponseDTO> getAll(int page, int size);
}