package com.example.datnmainpolo.dto.PromotionProductDetailDTO;

import com.example.datnmainpolo.enums.ProductStatus;
import com.example.datnmainpolo.enums.PromotionStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class PromotionProductDetailResponse {
    private Integer productDetailId;
    private String productCode;
    private String productName;
    private BigDecimal price;
    private BigDecimal promotionalPrice;
    private ProductStatus productStatus;
    private Integer promotionId;
    private String promotionCode;
    private String promotionName;
    private PromotionStatus promotionStatus;
    private BigDecimal priceAfterPromotion;
    private Instant startTime;
    private Instant endTime;
}