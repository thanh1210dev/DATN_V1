package com.example.datnmainpolo.dto.BillDTO;

import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
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
    private BigDecimal finalAmount; // ➕ tính toán từ backend

    private Instant confirmationDate;
    private Instant deliveryDate;
    private Instant receivedDate;
    private Instant completionDate;
    private Instant desiredDate;

    private PaymentType type;         // loại đơn (online/offline...)


    private String employeeName; // để show ai xử lý đơn


    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;


}
