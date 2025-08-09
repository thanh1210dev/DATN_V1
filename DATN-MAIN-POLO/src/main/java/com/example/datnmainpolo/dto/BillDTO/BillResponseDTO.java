package com.example.datnmainpolo.dto.BillDTO;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.enums.BillType;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.enums.VoucherType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
public class BillResponseDTO {
    private Integer id;
    private String code;
    private OrderStatus status;

    private Integer customerId;
    private String customerName;
    private String phoneNumber;
    private String address;

    private BillType billType;

    private BigDecimal totalMoney;
    private BigDecimal reductionAmount;
    private BigDecimal moneyShip;
    private BigDecimal finalAmount;
    private BigDecimal customerPayment; // New field for customer payment

    private com.example.datnmainpolo.enums.PaymentStatus paymentStatus; // new
    private com.example.datnmainpolo.enums.FulfillmentStatus fulfillmentStatus; // new

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant confirmationDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant deliveryDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant receivedDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant completionDate;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant desiredDate;

    private PaymentType type;

    private String employeeName;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    private String voucherCode;
    private String voucherName;
    private BigDecimal voucherDiscountAmount;
    private VoucherType voucherType;
    
    // Items list for bill details
    private List<BillDetailResponseDTO> items;
}