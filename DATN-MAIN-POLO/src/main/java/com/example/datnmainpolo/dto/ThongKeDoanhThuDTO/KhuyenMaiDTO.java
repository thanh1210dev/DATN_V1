package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class KhuyenMaiDTO {
    private String maKhuyenMai;
    private String tenKhuyenMai;
    private Long soLanSuDung;
    private BigDecimal tongDoanhThu;
}
