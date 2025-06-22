package com.example.datnmainpolo.service;



import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;

import java.time.LocalDate;
import java.util.List;

public interface ThongKeKhachHangService {
    List<KhachHangThanThietDTO> layKhachHangThanThiet(Integer top, LocalDate ngayBatDau, LocalDate ngayKetThuc);
}