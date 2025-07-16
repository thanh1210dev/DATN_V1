package com.example.datnmainpolo.dto.BillDTO;

import com.example.datnmainpolo.enums.PaymentType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class PaymentResponseDTO {
    private BillResponseDTO bill;

    private Integer billId;
    private PaymentType paymentType;
    private BigDecimal amount;
    private String qrCode;
    private String bankAccount;
    private String bankName;
    private String accountName;
    private String invoicePDF; // Base64-encoded PDF invoice
}