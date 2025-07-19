package com.example.datnmainpolo.dto.ProductDetailDTO;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ImportRequestDTO {
    @Min(value = 1, message = "Số lượng nhập phải lớn hơn 0")
    private Integer importQuantity;

    @NotNull(message = "Giá nhập không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá nhập phải lớn hơn 0")
    private BigDecimal importPrice;
}