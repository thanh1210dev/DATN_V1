package com.example.datnmainpolo.dto.ProductDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequestDTO {
    @NotNull(message = "ID chất liệu không được để trống")
    private Integer materialId;

    @NotNull(message = "ID thương hiệu không được để trống")
    private Integer brandId;

    @NotNull(message = "ID danh mục không được để trống")
    private Integer categoryId;

    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 200, message = "Mã sản phẩm không được vượt quá 100 ký tự")
    private String code;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 100, message = "Tên sản phẩm không được vượt quá 100 ký tự")
    private String name;

    @Size(max = 100, message = "Mô tả không được vượt quá 100 ký tự")
    private String description;
}