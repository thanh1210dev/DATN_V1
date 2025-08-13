package com.example.datnmainpolo.dto.ProductDetailDTO;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

import com.example.datnmainpolo.enums.ProductStatus;

@Getter
@Setter
public class ProductDetailRequestDTO {
    @NotNull(message = "ID sản phẩm không được để trống")
    private Integer productId;

    @NotEmpty(message = "Danh sách ID ảnh không được để trống")
    private List<Integer> imageIds;

    @NotEmpty(message = "Danh sách ID kích thước không được để trống")
    private List<Integer> sizeIds;

    @NotEmpty(message = "Danh sách ID màu sắc không được để trống")
    private List<Integer> colorIds;

    @Size(max = 5, message = "Mã phải có tối đa 5 ký tự")
    private String code;

    @Min(value = 0, message = "Số lượng phải lớn hơn hoặc bằng 0")
    private Integer quantity;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.00", inclusive = false, message = "Giá phải lớn hơn 0")
    @DecimalMax(value = "999000000000.00", message = "Giá phải nhỏ hơn hoặc bằng 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Giá tối đa 12 chữ số phần nguyên và 2 chữ số thập phân")
    private BigDecimal price;

        // importPrice removed; status optional (ignored on create, constrained on update)
        private ProductStatus status;
}