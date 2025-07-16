package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class YeuCauDoanhThuDTO {
    private String donViThoiGian; // "NGAY", "TUAN", "THANG", "QUY", "NAM"
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant ngayBatDau;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant ngayKetThuc;
    private String billType; // "ONLINE", "OFFLINE", or null for both
}