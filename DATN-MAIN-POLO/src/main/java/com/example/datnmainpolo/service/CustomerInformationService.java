package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;

public interface CustomerInformationService {
    CustomerInformationResponseDTO create(CustomerInformationRequestDTO requestDTO);
    CustomerInformationResponseDTO update(Integer id, CustomerInformationRequestDTO requestDTO);
    void softDelete(Integer id);
    CustomerInformationResponseDTO getById(Integer id);
    PaginationResponse<CustomerInformationResponseDTO> getAll(int page, int size);
}
