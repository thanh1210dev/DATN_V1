package com.example.datnmainpolo.dto.PromotionProductDetailDTO;


import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PromotionProductDetailRequestDTO {
    @NotNull(message = "ID chi tiết sản phẩm không được để trống")
    private Integer detailProductId;

    @NotNull(message = "ID chương trình khuyến mãi không được để trống")
    private Integer promotionId;

    @NotNull(message = "Giá gốc không được để trống")
    @Positive(message = "Giá gốc phải là số dương")
    private BigDecimal price;

    @NotNull(message = "Giá sau giảm không được để trống")
    @PositiveOrZero(message = "Giá sau giảm phải là số không âm")
    private BigDecimal priceAfterPromotion;
}
