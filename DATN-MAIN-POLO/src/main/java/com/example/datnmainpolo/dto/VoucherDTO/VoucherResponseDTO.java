package com.example.datnmainpolo.dto.VoucherDTO;

import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import com.example.datnmainpolo.enums.VoucherTypeUser;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class VoucherResponseDTO {
    private Integer id;
    private String code;
    private String name;
    private VoucherType type;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant startTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant endTime;
    private Integer quantity;
    private PromotionStatus status;
    private BigDecimal fixedDiscountValue;
    private BigDecimal percentageDiscountValue;
    private BigDecimal maxDiscountValue;
    private BigDecimal minOrderValue;
    private Integer createdByUserId;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean deleted;
    private VoucherTypeUser typeUser; // New field
}