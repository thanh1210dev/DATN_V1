package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PhuongThucThanhToanDTO {
    private String phuongThuc; // Phương thức thanh toán
    private Long soLuongDonHang; // Số lượng đơn hàng
    private Double tyLe;
    private BigDecimal tongDoanhThu;
}
