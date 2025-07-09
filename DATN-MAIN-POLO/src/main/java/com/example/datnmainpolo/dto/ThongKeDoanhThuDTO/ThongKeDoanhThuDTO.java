package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class ThongKeDoanhThuDTO {
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant ngay;
    private BigDecimal tongDoanhThu;
    private Long soLuongDonHang;

    public void setSoLuongDoanhHang(long l) {
    }
}