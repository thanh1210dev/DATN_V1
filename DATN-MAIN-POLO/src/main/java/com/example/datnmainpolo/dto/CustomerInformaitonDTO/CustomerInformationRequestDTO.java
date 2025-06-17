package com.example.datnmainpolo.dto.CustomerInformaitonDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerInformationRequestDTO {
    @NotBlank(message = "Tên không được để trống")
    @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
    private String name;
    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 250, message = "Địa chỉ không được vượt quá 250 ký tự")
    private String address;

}
