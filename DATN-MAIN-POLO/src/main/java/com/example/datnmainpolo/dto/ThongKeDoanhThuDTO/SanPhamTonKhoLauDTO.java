package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class SanPhamTonKhoLauDTO {
    private String maSanPham; // Mã sản phẩm chi tiết
    private String tenSanPham; // Tên sản phẩm
    private Long soLuongTon; // Số lượng tồn kho
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant ngayCapNhatCuoi; // Ngày cập nhật cuối
}