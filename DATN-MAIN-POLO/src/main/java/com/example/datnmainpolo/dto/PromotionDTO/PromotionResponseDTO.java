package com.example.datnmainpolo.dto.PromotionDTO;


import com.example.datnmainpolo.enums.DiscountType;
import com.example.datnmainpolo.enums.PromotionStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class PromotionResponseDTO {
    private Integer id;
    private String code;
    private String name;
    private DiscountType typePromotion;
    private Instant startTime;
    private Instant endTime;

    private BigDecimal percentageDiscountValue;
    private BigDecimal maxDiscountValue;

    private String description;
    private PromotionStatus status;
    private Integer createdByUserId;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean deleted;
}