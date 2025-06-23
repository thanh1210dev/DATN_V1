package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SanPhamTonKhoThapDTO {
    private String maSanPham; // Mã sản phẩm chi tiết
    private String tenSanPham; // Tên sản phẩm
    private Long soLuongTon; // Số lượng tồn kho
    private Integer nguongToiThieu; // Ngưỡng tối thiểu
}