package com.example.datnmainpolo.dto.ProductDetailDTO;


import com.example.datnmainpolo.enums.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class ProductDetailRequestDTO {
    @NotNull(message = "ID sản phẩm không được để trống")
    private Integer productId;

    @NotEmpty(message = "Danh sách ID ảnh không được để trống")
    private List<Integer> imageIds;

    @NotNull(message = "ID kích thước không được để trống")
    private Integer sizeId;

    @NotNull(message = "ID màu sắc không được để trống")
    private Integer colorId;


    @Min(value = 0, message = "Số lượng phải lớn hơn hoặc bằng 0")
    private Integer quantity;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
    private BigDecimal price;




    private ProductStatus status;
}
