package com.example.datnmainpolo.dto.UserDTO;

import com.example.datnmainpolo.enums.Role;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class UserResponseDTO {
    private Integer id;
    private Role role;
    private String code;
    private String name;
    private LocalDate birthDate;
    private String phoneNumber;
    private String email;
    private String avatar;
    private Integer loyaltyPoints;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean deleted;
}