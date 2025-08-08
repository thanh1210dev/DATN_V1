package com.example.datnmainpolo.dto.AccountVoucherDTO;
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
public class ClientAccountVoucherDTO {
    private Integer id; // AccountVoucher id
    private Integer voucherId;
    private Integer accountId;
    private String voucherCode;
    private String voucherName;
    private VoucherType voucherType;
    private VoucherTypeUser voucherTypeUser;
    private PromotionStatus voucherStatus;
    private BigDecimal fixedDiscountValue;
    private BigDecimal percentageDiscountValue;
    private BigDecimal maxDiscountValue;
    private BigDecimal minOrderValue;
    private Integer quantity; // Số lượng phân cho user
    private Boolean status; // trạng thái AccountVoucher

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant endTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant updatedAt;
}
