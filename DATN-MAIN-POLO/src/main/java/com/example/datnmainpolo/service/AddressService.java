package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationOnlineRequestDTO;

import com.example.datnmainpolo.entity.CustomerInformation;

import java.util.List;

public interface AddressService {
    CustomerInformation addAddress(Integer userId, CustomerInformationOnlineRequestDTO addressDTO);
    CustomerInformation updateAddress(Integer addressId, CustomerInformationOnlineRequestDTO addressDTO);
    void deleteAddress(Integer addressId);
    List<CustomerInformation> getUserAddresses(Integer userId);
    CustomerInformation setDefaultAddress(Integer userId, Integer addressId);
}