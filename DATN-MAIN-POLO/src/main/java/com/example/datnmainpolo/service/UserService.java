package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.dto.UserDTO.UserResponseDTO;

public interface UserService {
    UserResponseDTO createUser(UserRequestDTO requestDTO);
    UserResponseDTO updateUser(Integer id, UserRequestDTO requestDTO);
    UserResponseDTO getUserById(Integer id);
    void softDeleteUser(Integer id);
    PaginationResponse<UserResponseDTO> findByCodeAndName(String code, String name, int page, int size);
    PaginationResponse<UserResponseDTO> findByCodeAndNameofClient(
            String code, String name, String phoneNumber, String email,
            String startDate, String endDate, Boolean isBirthday,
            Integer minPoints, Integer maxPoints, String memberTier,
            int page, int size);
}