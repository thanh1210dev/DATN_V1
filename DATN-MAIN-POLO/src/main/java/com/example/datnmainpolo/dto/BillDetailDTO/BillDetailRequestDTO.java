package com.example.datnmainpolo.dto.BillDetailDTO;

import com.example.datnmainpolo.enums.BillDetailStatus;
import jakarta.validation.constraints.NotNull;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class BillDetailRequestDTO {
    @NotNull(message = "productDetailId không được để trống")
    private Integer productDetailId; // ID của sản phẩm trong chi tiết hóa đơn

    @NotNull(message = "billId không được để trống")
    private Integer billId; // ID của hóa đơn mà chi tiết này thuộc về

    @NotNull(message = "quantity không được để trống")
    private Integer quantity; // Số lượng của sản phẩm trong hóa đơn


    @NotNull
    private BillDetailStatus status; // Trạng thái của sản phẩm trong hóa đơn (Ví dụ: "Pending", "Shipped", "Delivered", v.v.)
}
