package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Integer> {
    // Lấy danh sách bill chưa bị xóa (phân trang)
    Page<Bill> findAllByDeletedFalse(Pageable pageable);

    // Tìm bill theo mã đơn hàng
    Optional<Bill> findByCode(String code);

    // Tìm tất cả theo trạng thái
    Page<Bill> findAllByStatusAndDeletedFalse(OrderStatus status, Pageable pageable);

    // Optional: tìm theo customer
    Page<Bill> findAllByCustomerIdAndDeletedFalse(Integer customerId, Pageable pageable);

    @Query("SELECT b FROM Bill b WHERE " +
            "(:code IS NULL OR b.code LIKE  CONCAT('%', :code, '%')) AND " +
            "(:status IS NULL OR b.status = :status) AND " +
            "b.deleted = false")
    Page<Bill> findByCodeOrStatus(
            @Param("code") String code,
            @Param("status") OrderStatus status,
            Pageable pageable);

}
