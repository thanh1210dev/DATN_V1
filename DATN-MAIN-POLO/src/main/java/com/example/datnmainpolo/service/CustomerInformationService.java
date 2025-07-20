package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationResponseDTO;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.entity.UserEntity;

import java.util.List;

public interface CustomerInformationService {
    List<CustomerInformationResponseDTO> getAddressesByUserId(Integer userId);
    CustomerInformationResponseDTO getDefaultAddressByUserId(Integer userId);
    CustomerInformationResponseDTO setDefaultAddress(Integer userId, Integer addressId);
    CustomerInformationResponseDTO saveAddress(CustomerInformationRequestDTO requestDTO, Integer userId);
    CustomerInformationResponseDTO updateAddress(Integer id, CustomerInformationRequestDTO requestDTO);
    void softDelete(Integer id);
    CustomerInformationResponseDTO getById(Integer id);
}