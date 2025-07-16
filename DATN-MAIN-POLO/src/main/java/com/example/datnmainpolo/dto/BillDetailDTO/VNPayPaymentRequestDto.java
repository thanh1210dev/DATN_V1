package com.example.datnmainpolo.dto.BillDetailDTO;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
@Getter
@Setter
public class VNPayPaymentRequestDto {
    @NotNull(message = "ID hóa đơn không được để trống")
    private Integer billId;

    @NotNull(message = "Số tiền thanh toán không được để trống")
    @DecimalMin(value = "0.0", message = "Số tiền thanh toán không được âm")
    private BigDecimal amount;

 
}
