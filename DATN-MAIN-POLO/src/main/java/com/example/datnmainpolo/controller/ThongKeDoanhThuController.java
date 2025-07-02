package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.*;
import com.example.datnmainpolo.service.ThongKeDoanhThuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/thong-ke/doanh-thu")
public class ThongKeDoanhThuController {

    @Autowired
    private ThongKeDoanhThuService thongKeDoanhThuService;

    @PostMapping("/theo-thoi-gian")
    public ResponseEntity<List<ThongKeDoanhThuDTO>> layDoanhThuTheoThoiGian(@RequestBody YeuCauDoanhThuDTO yeuCau) {
        return ResponseEntity.ok(thongKeDoanhThuService.layDoanhThuTheoThoiGian(yeuCau));
    }

    @GetMapping("/hom-nay")
    public ResponseEntity<ThongKeDoanhThuDTO> layDoanhThuHomNay() {
        return ResponseEntity.ok(thongKeDoanhThuService.layDoanhThuHomNay());
    }

    @GetMapping("/so-sanh")
    public ResponseEntity<List<SoSanhDoanhThuDTO>> soSanhDoanhThu(@RequestParam String ky) {
        return ResponseEntity.ok(thongKeDoanhThuService.soSanhDoanhThu(ky));
    }

    @GetMapping("/phuong-thuc-thanh-toan")
    public ResponseEntity<List<PhuongThucThanhToanDTO>> thongKePhuongThucThanhToan() {
        return ResponseEntity.ok(thongKeDoanhThuService.thongKePhuongThucThanhToan());
    }

    @GetMapping("/khuyen-mai")
    public ResponseEntity<List<KhuyenMaiDTO>> thongKeKhuyenMai(
            @RequestParam Instant ngayBatDau,
            @RequestParam Instant ngayKetThuc) {
        return ResponseEntity.ok(thongKeDoanhThuService.thongKeKhuyenMai(ngayBatDau, ngayKetThuc));
    }

    @GetMapping("/don-hang-trang-thai")
    public ResponseEntity<List<DonHangTheoTrangThaiDTO>> thongKeDonHangTheoTrangThai() {
        return ResponseEntity.ok(thongKeDoanhThuService.thongKeDonHangTheoTrangThai());
    }

    @GetMapping("/don-hang-thoi-gian")
    public ResponseEntity<List<DonHangTheoThoiGianDTO>> thongKeDonHangTheoThoiGian(
            @RequestParam Instant ngayBatDau,
            @RequestParam Instant ngayKetThuc) {
        return ResponseEntity.ok(thongKeDoanhThuService.thongKeDonHangTheoThoiGian(ngayBatDau, ngayKetThuc));
    }

    @GetMapping("/khach-hang-than-thiet")
    public ResponseEntity<Page<KhachHangThanThietDTO>> timKhachHangThanThiet(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(required = false) Boolean isBirthday,
            @RequestParam(required = false) Integer minPoints,
            @RequestParam(required = false) Integer maxPoints,
            @RequestParam(required = false) String memberTier,
            Pageable pageable
    ) {
        return ResponseEntity.ok(thongKeDoanhThuService.timKhachHangThanThiet(
                code, name, phoneNumber, email, startDate, endDate,
                isBirthday, minPoints, maxPoints, memberTier, pageable
        ));
    }

    @GetMapping("/nhan-vien-ban-hang")
    public ResponseEntity<List<NhanVienBanHangDTO>> thongKeNhanVienBanHang(
            @RequestParam Instant ngayBatDau,
            @RequestParam Instant ngayKetThuc) {
        return ResponseEntity.ok(thongKeDoanhThuService.thongKeNhanVienBanHang(ngayBatDau, ngayKetThuc));
    }
}