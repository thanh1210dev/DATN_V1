package com.example.datnmainpolo.dto.PromotionProductDetailDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class PromotionProductDetailResponseDTO {
    private Integer id;
    private Integer detailProductId;
    private Integer promotionId;
    private BigDecimal price;
    private BigDecimal priceAfterPromotion;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean deleted;
}