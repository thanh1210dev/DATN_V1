package com.example.datnmainpolo.dto.MaterialDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MaterialRequestDTO {
    @NotBlank(message = "Mã chất liệu không được để trống")
    @Size(max = 50, message = "Mã chất liệu không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên chất liệu không được để trống")
    @Size(max = 100, message = "Tên chất liệu không được vượt quá 100 ký tự")
    private String name;
}