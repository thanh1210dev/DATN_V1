package com.example.datnmainpolo.dto.BillDTO;

import com.example.datnmainpolo.enums.PaymentStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BillCreateDTO {
    private String customerName;
    private String deliveryAddress;
    private String deliveryPhoneNumber;
    private String transportUnit; // GHN, GHTK, SHOP_DELIVERY
    private PaymentStatus paymentStatus; // PAID_AT_COUNTER, COD
}