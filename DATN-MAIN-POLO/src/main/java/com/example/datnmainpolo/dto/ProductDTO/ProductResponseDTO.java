package com.example.datnmainpolo.dto.ProductDTO;


import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class ProductResponseDTO {
    private Integer id;
    private Integer materialId;
    private String materialName;
    private Integer brandId;
    private String brandName;
    private Integer categoryId;
    private String categoryName;
    private String code;
    private String name;
    private String description;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Instant createdAt;
    private Instant updatedAt;
}