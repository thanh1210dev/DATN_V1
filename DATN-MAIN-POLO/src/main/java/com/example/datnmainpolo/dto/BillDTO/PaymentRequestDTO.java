package com.example.datnmainpolo.dto.BillDTO;

import java.math.BigDecimal;

import com.example.datnmainpolo.enums.PaymentType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentRequestDTO {
    private PaymentType paymentType;  // Loại thanh toán (CASH, ONLINE)
    private BigDecimal amount;        // Số tiền thanh toán
}
