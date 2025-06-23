package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamBanChayDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamTonKhoLauDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamTonKhoThapDTO;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface ThongKeSanPhamService {

    List<SanPhamTonKhoThapDTO> laySanPhamTonKhoThap(Integer nguongToiThieu);
    List<SanPhamTonKhoLauDTO> laySanPhamTonKhoLau(Integer soNgay);
    List<SanPhamBanChayDTO> laySanPhamBanChay(Integer top, Instant ngayBatDau, Instant ngayKetThuc);
}