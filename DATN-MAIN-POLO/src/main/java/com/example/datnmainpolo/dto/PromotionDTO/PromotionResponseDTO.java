package com.example.datnmainpolo.dto.PromotionDTO;


import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;
import com.example.datnmainpolo.enums.DiscountType;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class PromotionResponseDTO {
    private Integer id;
    private String code;
    private String name;
    private DiscountType typePromotion;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant startTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant endTime;

    private BigDecimal percentageDiscountValue;
//    private BigDecimal maxDiscountValue;

    private String description;
    private PromotionStatus status;
    private Integer createdByUserId;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean deleted;



}