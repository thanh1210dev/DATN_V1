package com.example.datnmainpolo.repository.ThongKeRepo;


import com.example.datnmainpolo.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface NguoiDungRepository extends JpaRepository<UserEntity, Integer> {

    @Query("SELECT u.code as maKhachHang, u.name as tenKhachHang, " +
            "COUNT(b.id) as soLuongDonHang, SUM(b.finalAmount) as tongChiTieu " +
            "FROM Bill b " +
            "JOIN UserEntity u ON b.customer.id = u.id " +
            "WHERE b.status = 'COMPLETED' AND b.completionDate BETWEEN :ngayBatDau AND :ngayKetThuc " +
            "AND b.deleted = false AND u.deleted = false " +
            "GROUP BY u.code, u.name " +
            "ORDER BY tongChiTieu DESC " +
            "LIMIT :top")
    List<Object[]> timKhachHangThanThiet(@Param("ngayBatDau") LocalDate ngayBatDau,
                                         @Param("ngayKetThuc") LocalDate ngayKetThuc,
                                         @Param("top") Integer top);
}