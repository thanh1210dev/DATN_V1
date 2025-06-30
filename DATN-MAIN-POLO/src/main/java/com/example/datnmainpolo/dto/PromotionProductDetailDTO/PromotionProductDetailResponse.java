package com.example.datnmainpolo.dto.PromotionProductDetailDTO;

import com.example.datnmainpolo.enums.ProductStatus;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant startTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant endTime;

    private String productDeTailCode;
    private String productDeTailSize;
    private String productDeTailColor;
    private String colorName;
    private List<ImageDTO> images;


    @Getter
    @Setter
    public static class ImageDTO {
        private Integer id;
        private String url;
    }
}