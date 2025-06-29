package com.example.datnmainpolo.dto.BillDTO;



import lombok.Getter;
import lombok.Setter;

import java.time.Instant;



import com.fasterxml.jackson.annotation.JsonFormat;




@Getter
@Setter
public class DeliveryBillAddressRequestDTO {
    private Integer billId; // ID của hóa đơn
    private Integer provinceId; // ID tỉnh
    private Integer districtId; // ID huyện
    private String wardCode; // Mã xã/phường
    private String addressDetail; // Địa chỉ chi tiết (số nhà, đường,...)
    private String customerName; // Tên khách hàng
    private String phoneNumber; // Số điện thoại
    private Double moneyShip;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Instant desiredDate; // Ngày mong muốn giao hàng
}