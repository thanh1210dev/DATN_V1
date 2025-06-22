package com.example.datnmainpolo.repository.ThongKeRepo;

import com.example.datnmainpolo.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface HoaDonRepository extends JpaRepository<Bill, Integer> {

    @Query(value = """
        SELECT CONVERT(DATE, b.completion_date) AS ngay,
               SUM(b.final_amount) AS tong_doanh_thu,
               COUNT(b.id) AS so_luong_don_hang
        FROM bill b
        WHERE b.status = :status
          AND b.completion_date BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
        GROUP BY CONVERT(DATE, b.completion_date)
        ORDER BY ngay
    """, nativeQuery = true)
    List<Object[]> timDoanhThuTheoDonViThoiGian(
            @Param("status") String status,
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc
    );

    @Query(value = """
        SELECT b.payment_method AS phuong_thuc,
               COUNT(b.id) AS so_luong_don_hang,
               SUM(b.final_amount) AS tong_doanh_thu
        FROM bill b
        WHERE b.status = 'COMPLETED'
          AND b.deleted = 0
        GROUP BY b.payment_method
    """, nativeQuery = true)
    List<Object[]> thongKePhuongThucThanhToan();

    @Query(value = """
        SELECT v.code AS ma_khuyen_mai,
               v.name AS ten_khuyen_mai,
               COUNT(b.id) AS so_lan_su_dung,
               SUM(b.final_amount) AS tong_doanh_thu
        FROM bill b
        LEFT JOIN voucher v ON b.voucher_id = v.id
        WHERE b.status = 'COMPLETED'
          AND b.completion_date BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
        GROUP BY v.code, v.name
        HAVING COUNT(b.id) > 0
    """, nativeQuery = true)
    List<Object[]> thongKeKhuyenMai(
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc
    );

    @Query(value = """
        SELECT b.status AS trang_thai,
               COUNT(b.id) AS so_luong_don_hang
        FROM bill b
        WHERE b.deleted = 0
        GROUP BY b.status
    """, nativeQuery = true)
    List<Object[]> thongKeDonHangTheoTrangThai();

    @Query(value = """
        SELECT CONVERT(DATE, b.created_at) AS ngay,
               COUNT(b.id) AS so_luong_don_hang
        FROM bill b
        WHERE b.created_at BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
        GROUP BY CONVERT(DATE, b.created_at)
        ORDER BY ngay
    """, nativeQuery = true)
    List<Object[]> thongKeDonHangTheoThoiGian(
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc
    );

    @Query(value = """
        SELECT a.code AS ma_khach_hang,
               a.name AS ten_khach_hang,
               COUNT(b.id) AS so_luong_don_hang,
               SUM(b.final_amount) AS tong_chi_tieu
        FROM bill b
        JOIN account a ON b.customer_id = a.id
        WHERE b.status = 'COMPLETED'
          AND b.completion_date BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
        GROUP BY a.code, a.name
        ORDER BY tong_chi_tieu DESC
        OFFSET 0 ROWS FETCH NEXT :top ROWS ONLY
    """, nativeQuery = true)
    List<Object[]> timKhachHangThanThiet(
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc,
            @Param("top") Integer top
    );
}