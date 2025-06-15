package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    @Query("SELECT v FROM Voucher v WHERE " +
            "(:code IS NULL OR v.code LIKE %:code%) " +
            "AND (:startTime IS NULL OR v.startTime >= :startTime) " +
            "AND (:endTime IS NULL OR v.endTime <= :endTime) " +
            "AND (:status IS NULL OR v.status = :status) " +
            "AND v.deleted = false")
    Page<Voucher> findByCodeAndStartTimeAndEndTimeAndStatus(
            @Param("code") String code,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("status") PromotionStatus status,
            Pageable pageable);

    Optional<Voucher> findByIdAndDeletedFalse(Integer id);

    Optional<Voucher> findByCodeAndDeletedFalse(String code);

    @Query("SELECT v FROM Voucher v WHERE v.status = com.example.datnmainpolo.enums.PromotionStatus.COMING_SOON AND v.startTime <= :currentTime AND v.deleted = false")
    List<Voucher> findVouchersToActivate(@Param("currentTime") Instant currentTime);

    @Query("SELECT v FROM Voucher v WHERE v.status IN (com.example.datnmainpolo.enums.PromotionStatus.ACTIVE, com.example.datnmainpolo.enums.PromotionStatus.COMING_SOON) AND v.endTime < :currentTime AND v.deleted = false")
    List<Voucher> findVouchersToExpire(@Param("currentTime") Instant currentTime);

    List<Voucher> findByEndTimeBeforeAndStatusNot(Instant endTimeBefore, PromotionStatus status);

    List<Voucher> findByStatusInAndDeletedFalse(Collection<PromotionStatus> statuses);
}