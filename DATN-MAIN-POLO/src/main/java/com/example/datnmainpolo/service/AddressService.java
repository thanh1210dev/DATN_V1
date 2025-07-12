package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.entity.CustomerInformation;

import java.util.List;

public interface AddressService {
    CustomerInformation addAddress(Integer userId, CustomerInformationRequestDTO addressDTO);
    CustomerInformation updateAddress(Integer addressId, CustomerInformationRequestDTO addressDTO);
    void deleteAddress(Integer addressId);
    List<CustomerInformation> getUserAddresses(Integer userId);
    CustomerInformation setDefaultAddress(Integer userId, Integer addressId);
}