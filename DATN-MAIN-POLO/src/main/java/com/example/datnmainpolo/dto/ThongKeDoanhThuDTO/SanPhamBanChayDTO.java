package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;


@Getter
@Setter
public class SanPhamBanChayDTO {
    private String maSanPham;
    private String tenSanPham;
    private String mauSac;
    private String kichCo;
    private Long soLuongBan;
    private BigDecimal doanhThu;
}