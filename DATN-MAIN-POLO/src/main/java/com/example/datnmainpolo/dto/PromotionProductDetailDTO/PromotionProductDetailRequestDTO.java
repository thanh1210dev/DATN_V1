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
    @DecimalMin(value = "0.01", message = "Giá gốc phải > 0")
    @DecimalMax(value = "999000000000.00", message = "Giá gốc tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Giá gốc tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal price;

    @NotNull(message = "Giá sau giảm không được để trống")
    @DecimalMin(value = "0.00", message = "Giá sau giảm phải >= 0")
    @DecimalMax(value = "999000000000.00", message = "Giá sau giảm tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Giá sau giảm tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal priceAfterPromotion;

    // Ghi chú: Logic dịch vụ nên đảm bảo priceAfterPromotion <= price (kiểm tra ở Service nếu chưa có)
}
