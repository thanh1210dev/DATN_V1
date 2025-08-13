package com.example.datnmainpolo.dto.BillDTO;


import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class BillRequestDTO {
    private Integer billId;
    private Integer voucherId;
    @NotNull(message = "customerId không được để trống")
    private Integer customerId;

    @NotNull(message = "employeeId không được để trống")
    private Integer employeeId;

    @NotNull(message = "customerInforId không được để trống")
    private Integer customerInforId;

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 100, message = "Tên khách hàng không được vượt quá 100 ký tự")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phoneNumber;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 100, message = "Địa chỉ không được vượt quá 100 ký tự")
    private String address;

    @NotNull
    private PaymentType type;


    @DecimalMin(value = "0.00", inclusive = true, message = "Tiền ship không được âm")
    @DecimalMax(value = "999000000000.00", message = "Tiền ship tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Tiền ship tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal moneyShip;

    @DecimalMin(value = "0.00", inclusive = true, message = "Tiền đặt cọc không được âm")
    @DecimalMax(value = "999000000000.00", message = "Tiền đặt cọc tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Tiền đặt cọc tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal deposit;

    private OrderStatus status;

    private Instant desiredDate;

    
}
