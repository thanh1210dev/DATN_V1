package com.example.datnmainpolo.dto.ShirtCollarDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShirtCollarRequestDTO {
    @NotBlank(message = "Mã cổ áo không được để trống")
    @Size(max = 50, message = "Mã cổ áo không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên cổ áo không được để trống")
    @Size(max = 100, message = "Tên cổ áo không được vượt quá 100 ký tự")
    private String name;
}
