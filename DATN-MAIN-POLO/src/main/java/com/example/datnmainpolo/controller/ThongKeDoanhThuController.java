package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.DonHangTheoThoiGianDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.DonHangTheoTrangThaiDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhuyenMaiDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.PhuongThucThanhToanDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SoSanhDoanhThuDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.ThongKeDoanhThuDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.YeuCauDoanhThuDTO;
import com.example.datnmainpolo.service.ThongKeDoanhThuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


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
    public ResponseEntity<List<KhachHangThanThietDTO>> timKhachHangThanThiet(
            @RequestParam(defaultValue = "5") Integer top,
            @RequestParam Instant ngayBatDau,
            @RequestParam Instant ngayKetThuc) {
        return ResponseEntity.ok(thongKeDoanhThuService.timKhachHangThanThiet(top, ngayBatDau, ngayKetThuc));
    }
}