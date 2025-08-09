package com.example.datnmainpolo.dto.Checkout;

import com.example.datnmainpolo.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestOrderRequestDTO {
    private String name;
    private String phoneNumber;
    private String email;
    private String address; // detail address

    private Integer provinceId;
    private Integer districtId;
    private String wardCode;

    private String provinceName;
    private String districtName;
    private String wardName;

    private PaymentType paymentType;

    private List<Item> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private Integer productDetailId;
        private Integer quantity;
    }
}
