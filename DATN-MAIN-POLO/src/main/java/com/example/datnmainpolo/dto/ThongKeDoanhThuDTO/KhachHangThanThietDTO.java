package com.example.datnmainpolo.dto.ThongKeDoanhThuDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class KhachHangThanThietDTO {
    private String maKhachHang;
    private String tenKhachHang;
    private Long soLuongDonHang;
    private BigDecimal tongChiTieu;
    private Integer loyaltyPoints;
    private String memberTier;

    // Constructor for JPQL query
    public KhachHangThanThietDTO(String maKhachHang, String tenKhachHang, Long soLuongDonHang, BigDecimal tongChiTieu, Integer loyaltyPoints, String memberTier) {
        this.maKhachHang = maKhachHang;
        this.tenKhachHang = tenKhachHang;
        this.soLuongDonHang = soLuongDonHang;
        this.tongChiTieu = tongChiTieu;
        this.loyaltyPoints = loyaltyPoints;
        this.memberTier = memberTier;
    }

    // No-arg constructor for frameworks (e.g., Jackson, Hibernate)
    public KhachHangThanThietDTO() {
    }
}