package com.example.datnmainpolo.dto.ColorDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ColorRequestDTO {
    @NotBlank(message = "Mã màu sắc không được để trống")
    @Size(max = 50, message = "Mã màu sắc không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên màu sắc không được để trống")
    @Size(max = 100, message = "Tên màu sắc không được vượt quá 100 ký tự")
    private String name;
}