
        package com.example.datnmainpolo.repository.ThongKeRepo;

import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
          AND (:billType IS NULL OR b.bill_type = :billType)
        GROUP BY CONVERT(DATE, b.completion_date)
        ORDER BY ngay
    """, nativeQuery = true)
    List<Object[]> timDoanhThuTheoDonViThoiGian(
            @Param("status") String status,
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc,
            @Param("billType") String billType
    );

    @Query(value = """
        SELECT u.code AS ma_nhan_vien,
               u.name AS ten_nhan_vien,
               COUNT(b.id) AS so_luong_don_hang,
               SUM(b.final_amount) AS tong_doanh_thu
        FROM bill b
        LEFT JOIN account u ON b.employee_id = u.id
        WHERE b.status = 'COMPLETED'
          AND b.bill_type = 'OFFLINE'
          AND b.completion_date BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
        GROUP BY u.code, u.name
        ORDER BY tong_doanh_thu DESC
    """, nativeQuery = true)
    List<Object[]> thongKeNhanVienBanHang(
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc
    );

    @Query(value = """
        SELECT b.type AS phuong_thuc,
               COUNT(b.id) AS so_luong_don_hang,
               SUM(b.final_amount) AS tong_doanh_thu
        FROM bill b
        WHERE b.status = 'COMPLETED'
          AND b.deleted = 0
        GROUP BY b.type
    """, nativeQuery = true)
    List<Object[]> thongKePhuongThucThanhToan();

    @Query(value = """
        SELECT b.voucher_code AS ma_khuyen_mai,
               b.voucher_name AS ten_khuyen_mai,
               COUNT(b.id) AS so_lan_su_dung,
               SUM(b.final_amount) AS tong_doanh_thu
        FROM bill b
        WHERE b.status = 'COMPLETED'
          AND b.completion_date BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
          AND b.voucher_code IS NOT NULL
        GROUP BY b.voucher_code, b.voucher_name
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

    @Query("SELECT new com.example.datnmainpolo.dto.ThongKeDoanhThuDTO.KhachHangThanThietDTO(" +
            "u.code, u.name, COUNT(b.id), SUM(b.finalAmount), u.loyaltyPoints, " +
            "CASE " +
            "WHEN u.loyaltyPoints < 500 THEN 'BRONZE' " +
            "WHEN u.loyaltyPoints BETWEEN 500 AND 999 THEN 'SILVER' " +
            "WHEN u.loyaltyPoints BETWEEN 1000 AND 1999 THEN 'GOLD' " +
            "ELSE 'PLATINUM' END) " +
            "FROM UserEntity u LEFT JOIN Bill b ON b.customer = u " +
            "WHERE u.role = 'CLIENT' " +
            "AND (:code IS NULL OR u.code LIKE CONCAT('%', :code, '%')) " +
            "AND (:name IS NULL OR u.name LIKE CONCAT('%', :name, '%')) " +
            "AND (:phoneNumber IS NULL OR u.phoneNumber LIKE CONCAT('%', :phoneNumber, '%')) " +
            "AND (:email IS NULL OR u.email LIKE CONCAT('%', :email, '%')) " +
            "AND u.deleted = false " +
            "AND (:startDate IS NULL OR EXISTS (SELECT b2 FROM Bill b2 WHERE b2.customer = u " +
            "AND b2.status = 'PAID' AND b2.completionDate >= :startDate)) " +
            "AND (:endDate IS NULL OR EXISTS (SELECT b3 FROM Bill b3 WHERE b3.customer = u " +
            "AND b3.status = 'PAID' AND b3.completionDate <= :endDate)) " +
            "AND (:isBirthday IS NULL OR :isBirthday = false OR " +
            "(FUNCTION('DAY', u.birthDate) = FUNCTION('DAY', CURRENT_DATE) " +
            "AND FUNCTION('MONTH', u.birthDate) = FUNCTION('MONTH', CURRENT_DATE))) " +
            "AND (:minPoints IS NULL OR u.loyaltyPoints >= :minPoints) " +
            "AND (:maxPoints IS NULL OR u.loyaltyPoints <= :maxPoints) " +
            "AND (:memberTier IS NULL OR " +
            "(:memberTier = 'BRONZE' AND u.loyaltyPoints < 500) OR " +
            "(:memberTier = 'SILVER' AND u.loyaltyPoints BETWEEN 500 AND 999) OR " +
            "(:memberTier = 'GOLD' AND u.loyaltyPoints BETWEEN 1000 AND 1999) OR " +
            "(:memberTier = 'PLATINUM' AND u.loyaltyPoints >= 2000)) " +
            "GROUP BY u.id, u.code, u.name, u.loyaltyPoints " +
            "ORDER BY SUM(b.finalAmount) DESC")
    Page<KhachHangThanThietDTO> timKhachHangThanThiet(
            @Param("code") String code,
            @Param("name") String name,
            @Param("phoneNumber") String phoneNumber,
            @Param("email") String email,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("isBirthday") Boolean isBirthday,
            @Param("minPoints") Integer minPoints,
            @Param("maxPoints") Integer maxPoints,
            @Param("memberTier") String memberTier,
            Pageable pageable
    );
}
