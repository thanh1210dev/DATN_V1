package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.dto.UserDTO.UserResponseDTO;
import com.example.datnmainpolo.enums.Role;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public interface UserService {
    UserResponseDTO createUser(UserRequestDTO requestDTO);
    UserResponseDTO updateUser(Integer id, UserRequestDTO requestDTO);
    UserResponseDTO getUserById(Integer id);

    void softDeleteUser(Integer id);

    PaginationResponse<UserResponseDTO> findByCodeAndName(String code, String name, int page, int size);
    PaginationResponse<UserResponseDTO> findByCodeAndNameofClient(
            String code, String name, String phoneNumber, String email,
            Integer minLoyaltyPoints, Integer maxLoyaltyPoints,
            LocalDate birthDate, Instant startDate, Instant endDate,
            int page, int size);
    PaginationResponse<UserResponseDTO> findTopPurchasers(String code, String name, int page, int size);

    PaginationResponse<UserResponseDTO> findByPhoneNumberOrNameOrEmailAndRole(String phoneNumber, String name , String email, Role role, int page, int size);
    void updateLoyaltyPoints(Integer customerId, BigDecimal orderValue);
}