package com.example.datnmainpolo.dto.ProductDetailDTO;
import com.example.datnmainpolo.enums.ProductStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class ProductDetailResponseDTO {
    private Integer id;
    private Integer productId;
    private String productName;
    private String productCode;
    private String code;
    private List<ImageDTO> images;
    private Integer sizeId;
    private String sizeName;
    private Integer colorId;
    private String colorName;
    private String colorCode;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal importPrice;
    private BigDecimal promotionalPrice;

    private Integer soldQuantity = 0;
    private ProductStatus status;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    public static class ImageDTO {
        private Integer id;
        private String url;
    }
}