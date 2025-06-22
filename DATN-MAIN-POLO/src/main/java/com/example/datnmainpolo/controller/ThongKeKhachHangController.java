package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;
import com.example.datnmainpolo.service.ThongKeKhachHangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/thong-ke/khach-hang")
public class ThongKeKhachHangController {

    @Autowired
    private ThongKeKhachHangService thongKeKhachHangService;

    @GetMapping("/than-thiet")
    public ResponseEntity<List<KhachHangThanThietDTO>> layKhachHangThanThiet(
            @RequestParam(defaultValue = "10") Integer top,
            @RequestParam LocalDate ngayBatDau,
            @RequestParam LocalDate ngayKetThuc) {
        return ResponseEntity.ok(thongKeKhachHangService.layKhachHangThanThiet(top, ngayBatDau, ngayKetThuc));
    }
}