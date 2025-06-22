package com.example.datnmainpolo.service;


import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.DonHangTheoThoiGianDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.DonHangTheoTrangThaiDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhuyenMaiDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.PhuongThucThanhToanDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SoSanhDoanhThuDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.ThongKeDoanhThuDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.YeuCauDoanhThuDTO;

import java.time.Instant;
import java.util.List;

public interface ThongKeDoanhThuService {
    List<ThongKeDoanhThuDTO> layDoanhThuTheoThoiGian(YeuCauDoanhThuDTO yeuCau);
    ThongKeDoanhThuDTO layDoanhThuHomNay();
    List<SoSanhDoanhThuDTO> soSanhDoanhThu(String ky);
    List<PhuongThucThanhToanDTO> thongKePhuongThucThanhToan();
    List<KhuyenMaiDTO> thongKeKhuyenMai(Instant ngayBatDau, Instant ngayKetThuc);
    List<DonHangTheoTrangThaiDTO> thongKeDonHangTheoTrangThai();
    List<DonHangTheoThoiGianDTO> thongKeDonHangTheoThoiGian(Instant ngayBatDau, Instant ngayKetThuc);
    List<KhachHangThanThietDTO> timKhachHangThanThiet(Integer top, Instant ngayBatDau, Instant ngayKetThuc);
}