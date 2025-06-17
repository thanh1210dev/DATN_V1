package com.example.datnmainpolo.dto.TransactionDTO;

import com.example.datnmainpolo.enums.TransactionStatus;
import com.example.datnmainpolo.enums.TransactionType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class TransactionResponseDTO {
    private Integer id;
    private Integer billId;
    private BigDecimal totalMoney;
    private TransactionStatus status;
    private TransactionType type;
    private String note;
    private Instant createdAt;
}
