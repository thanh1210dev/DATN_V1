package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class ThongKeDoanhThuDTO {
    private Instant ngay;
    private BigDecimal tongDoanhThu;
    private Long soLuongDonHang;
}