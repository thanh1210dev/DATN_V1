package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class SanPhamTonKhoLauDTO {
    private String maSanPham; // Mã sản phẩm chi tiết
    private String tenSanPham; // Tên sản phẩm
    private Long soLuongTon; // Số lượng tồn kho
    private Instant ngayCapNhatCuoi; // Ngày cập nhật cuối
}