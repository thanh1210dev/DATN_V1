package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SoSanhDoanhThuDTO {
    private String ky; // Ví dụ: "Tháng này", "Tháng trước"
    private BigDecimal doanhThu; // Doanh thu của kỳ
    private Double tyLeTangTruong; // Tỷ lệ tăng trưởng (%) so với kỳ trước
}