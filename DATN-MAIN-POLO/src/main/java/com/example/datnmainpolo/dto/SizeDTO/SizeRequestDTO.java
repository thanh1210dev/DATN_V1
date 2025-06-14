package com.example.datnmainpolo.dto.SizeDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SizeRequestDTO {
    @NotBlank(message = "Mã kích thước không được để trống")
    @Size(max = 50, message = "Mã kích thước không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên kích thước không được để trống")
    @Size(max = 100, message = "Tên kích thước không được vượt quá 100 ký tự")
    private String name;
}