package com.example.datnmainpolo.repository.ThongKeRepo;



import com.example.datnmainpolo.entity.ProductDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ChiTietSanPhamRepository extends JpaRepository<ProductDetail, Integer> {

    @Query(value = """
        SELECT p.code AS maSanPham,
               p.name AS tenSanPham,
               c.name AS mauSac,
               s.name AS kichCo,
               SUM(bd.quantity) AS soLuongBan,
               SUM(bd.quantity * bd.price) AS doanhThu
        FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        JOIN color c ON pd.color_id = c.id
        JOIN size s ON pd.size_id = s.id
        JOIN bill_detail bd ON pd.id = bd.product_details_id
        JOIN bill b ON bd.bill_id = b.id
        WHERE b.status = 'COMPLETED'
          AND b.completion_date BETWEEN :ngayBatDau AND :ngayKetThuc
          AND b.deleted = 0
        GROUP BY p.code, p.name, c.name, s.name
        ORDER BY soLuongBan DESC
        OFFSET 0 ROWS FETCH NEXT :top ROWS ONLY
    """, nativeQuery = true)
    List<Object[]> timSanPhamBanChay(
            @Param("ngayBatDau") Instant ngayBatDau,
            @Param("ngayKetThuc") Instant ngayKetThuc,
            @Param("top") Integer top
    );

    @Query(value = """
        SELECT p.code AS maSanPham,
               p.name AS tenSanPham,
               pd.quantity AS soLuongTon,
               :nguongToiThieu AS nguongToiThieu
        FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        JOIN color c ON pd.color_id = c.id
        JOIN size s ON pd.size_id = s.id
        WHERE pd.quantity <= :nguongToiThieu
        ORDER BY pd.quantity ASC
    """, nativeQuery = true)
    List<Object[]> timSanPhamTonKhoThap(@Param("nguongToiThieu") Integer nguongToiThieu);

    @Query(value = """
        SELECT p.code AS maSanPham,
               p.name AS tenSanPham,
               pd.quantity AS soLuongTon,
               pd.updated_at AS ngayCapNhatCuoi
        FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        JOIN color c ON pd.color_id = c.id
        JOIN size s ON pd.size_id = s.id
        WHERE pd.updated_at <= :ngayToiDa
          AND pd.quantity > 0
        ORDER BY pd.updated_at ASC
    """, nativeQuery = true)
    List<Object[]> timSanPhamTonKhoLau(@Param("ngayToiDa") Instant ngayToiDa);
}