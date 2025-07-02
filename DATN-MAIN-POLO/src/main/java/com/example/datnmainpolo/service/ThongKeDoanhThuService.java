
        package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    Page<KhachHangThanThietDTO> timKhachHangThanThiet(
            String code, String name, String phoneNumber, String email,
            Instant startDate, Instant endDate, Boolean isBirthday,
            Integer minPoints, Integer maxPoints, String memberTier,
            Pageable pageable
    );
    List<NhanVienBanHangDTO> thongKeNhanVienBanHang(Instant ngayBatDau, Instant ngayKetThuc);
}
