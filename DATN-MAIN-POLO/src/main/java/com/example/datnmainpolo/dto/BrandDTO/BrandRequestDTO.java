package com.example.datnmainpolo.dto.BrandDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BrandRequestDTO {
    @NotBlank(message = "Mã thương hiệu không được để trống")
    @Size(max = 50, message = "Mã thương hiệu không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(max = 100, message = "Tên thương hiệu không được vượt quá 100 ký tự")
    private String name;
}