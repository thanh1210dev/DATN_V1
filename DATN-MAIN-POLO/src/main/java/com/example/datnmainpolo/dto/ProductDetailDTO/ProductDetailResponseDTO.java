package com.example.datnmainpolo.dto.ProductDetailDTO;
import com.example.datnmainpolo.enums.ProductStatus;
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
    private List<ImageDTO> images;
    private Integer sizeId;
    private String sizeName;
    private Integer colorId;
    private String colorName;
    private String colorCode;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal promotionalPrice;
    private ProductStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    public static class ImageDTO {
        private Integer id;
        private String url;
    }
}