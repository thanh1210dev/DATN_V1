package com.example.datnmainpolo.dto.BillDTO;


import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.enums.VoucherType; // Import VoucherType
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
public class BillResponseDTO {
    private Integer id;
    private String code;
    private OrderStatus status;

    private String customerName;
    private String phoneNumber;
    private String address;

    private BigDecimal totalMoney;
    private BigDecimal reductionAmount;
    private BigDecimal moneyShip;
    private BigDecimal finalAmount;

    private Instant confirmationDate;
    private Instant deliveryDate;
    private Instant receivedDate;
    private Instant completionDate;
    private Instant desiredDate;

    private PaymentType type;

    private String employeeName;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    // New fields for voucher details
    private String voucherCode;
    private String voucherName;
    private BigDecimal voucherDiscountAmount;
    private VoucherType voucherType; // PERCENTAGE or FIXED

}