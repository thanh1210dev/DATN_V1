package com.example.datnmainpolo.dto.TransactionDTO;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

@Getter
@Setter
public class TransactionRequestDTO {
    private Integer billId;

    @DecimalMin(value = "0.00", message = "Số tiền phải >= 0")
    @DecimalMax(value = "999000000000.00", message = "Số tiền phải <= 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal totalMoney;

    private String note;
}
