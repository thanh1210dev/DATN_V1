package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Integer> {
    Page<Bill> findAllByDeletedFalse(Pageable pageable);
    Optional<Bill> findByCode(String code);
    Page<Bill> findAllByStatusAndDeletedFalse(OrderStatus status, Pageable pageable);
    Page<Bill> findAllByCustomerIdAndDeletedFalse(Integer customerId, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.status = :status AND b.deleted = false")
    long countByStatusAndDeletedFalse(@Param("status") OrderStatus status);

    @Query("SELECT b FROM Bill b WHERE " +
            "(:code IS NULL OR b.code LIKE CONCAT('%', :code, '%')) AND " +
            "(:status IS NULL OR b.status = :status) AND " +
            "b.deleted = false")
    Page<Bill> findByCodeOrStatus(
            @Param("code") String code,
            @Param("status") OrderStatus status,
            Pageable pageable);

    @Query("SELECT b FROM Bill b WHERE " +
            "(:code IS NULL OR b.code LIKE CONCAT('%', :code, '%')) " +
            "AND (:status IS NULL OR b.status = :status) " +
            "AND (:phoneNumber IS NULL OR b.phoneNumber LIKE CONCAT('%', :phoneNumber, '%')) " +
            "AND (:startDate IS NULL OR b.createdAt >= :startDate) " +
            "AND (:endDate IS NULL OR b.createdAt <= :endDate) " +
            "AND (:minPrice IS NULL OR b.finalAmount >= :minPrice) " +
            "AND (:maxPrice IS NULL OR b.finalAmount <= :maxPrice) " +
            "AND b.deleted = false")
    Page<Bill> findByAdvancedCriteria(
            @Param("code") String code,
            @Param("status") OrderStatus status,
            @Param("phoneNumber") String phoneNumber,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    Page<Bill> findByCustomerIdAndDeletedFalse(Integer userId, Pageable pageable);
    Page<Bill> findByCustomerIdAndStatusAndDeletedFalse(Integer customerId, OrderStatus status, Pageable pageable);

    // Public lookup by exact code and phone, not deleted
    Optional<Bill> findByCodeAndPhoneNumberAndDeletedFalse(String code, String phoneNumber);
}