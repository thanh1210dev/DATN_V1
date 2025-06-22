package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamBanChayDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamTonKhoLauDTO;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.SanPhamTonKhoThapDTO;
import com.example.datnmainpolo.service.ThongKeSanPhamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/thong-ke/san-pham")
public class ThongKeSanPhamController {

    @Autowired
    private ThongKeSanPhamService thongKeSanPhamService;

    @GetMapping("/ban-chay")
    public ResponseEntity<List<SanPhamBanChayDTO>> laySanPhamBanChay(
            @RequestParam(defaultValue = "5") Integer top,
            @RequestParam Instant ngayBatDau,
            @RequestParam Instant ngayKetThuc) {
        return ResponseEntity.ok(thongKeSanPhamService.laySanPhamBanChay(top, ngayBatDau, ngayKetThuc));
    }

    @GetMapping("/ton-kho-thap")
    public ResponseEntity<List<SanPhamTonKhoThapDTO>> laySanPhamTonKhoThap(
            @RequestParam(defaultValue = "10") Integer nguongToiThieu) {
        return ResponseEntity.ok(thongKeSanPhamService.laySanPhamTonKhoThap(nguongToiThieu));
    }

    @GetMapping("/ton-kho-lau")
    public ResponseEntity<List<SanPhamTonKhoLauDTO>> laySanPhamTonKhoLau(
            @RequestParam(defaultValue = "30") Integer soNgay) {
        return ResponseEntity.ok(thongKeSanPhamService.laySanPhamTonKhoLau(soNgay));
    }
}