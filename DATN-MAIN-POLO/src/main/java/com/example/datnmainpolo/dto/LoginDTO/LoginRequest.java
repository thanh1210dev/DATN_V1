package com.example.datnmainpolo.dto.LoginDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Tài khoản không được để trống")
    private String identifier; // email hoặc phone
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}

