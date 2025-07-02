package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class YeuCauDoanhThuDTO {
    private String donViThoiGian; // "NGAY", "TUAN", "THANG", "QUY", "NAM"
    private Instant ngayBatDau;
    private Instant ngayKetThuc;
    private String billType; // "ONLINE", "OFFLINE", or null for both
}