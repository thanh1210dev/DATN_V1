package com.example.datnmainpolo.dto.VoucherDTO;

import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import com.example.datnmainpolo.enums.VoucherTypeUser;
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
    private Instant startTime;
    private Instant endTime;
    private Integer quantity;
    private PromotionStatus status;
    private BigDecimal fixedDiscountValue;
    private BigDecimal percentageDiscountValue;
    private BigDecimal maxDiscountValue;
    private BigDecimal minOrderValue;
    private Integer createdByUserId;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean deleted;
    private VoucherTypeUser typeUser; // New field
}