package com.example.datnmainpolo.dto.TransactionDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransactionRequestDTO {
    private Integer billId;
    private BigDecimal totalMoney;
    private String note;
}
