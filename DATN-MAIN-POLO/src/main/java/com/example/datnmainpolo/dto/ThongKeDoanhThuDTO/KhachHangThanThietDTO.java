package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;



import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class KhachHangThanThietDTO {
    private String maKhachHang;
    private String tenKhachHang;
    private Long soLuongDonHang;
    private BigDecimal tongChiTieu;
}