package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class DonHangTheoThoiGianDTO {
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant ngay;
    private Long soLuongDonHang;
}