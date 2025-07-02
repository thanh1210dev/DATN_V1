package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class NhanVienBanHangDTO {
    private String maNhanVien;
    private String tenNhanVien;
    private Long soLuongDonHang;
    private BigDecimal tongDoanhThu;
}
