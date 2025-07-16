package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherTypeUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    @Query("SELECT v FROM Voucher v WHERE " +
            "(:code IS NULL OR v.code LIKE CONCAT('%', :code, '%')) " +
            "AND (:name IS NULL OR v.name LIKE CONCAT('%', :name, '%')) " +
            "AND (:startTime IS NULL OR v.startTime >= :startTime) " +
            "AND (:endTime IS NULL OR v.endTime <= :endTime) " +
            "AND (:status IS NULL OR v.status = :status) " +
            "AND (:percentageDiscountValue IS NULL OR v.percentageDiscountValue = :percentageDiscountValue) " +
            "AND (:fixedDiscountValue IS NULL OR v.fixedDiscountValue = :fixedDiscountValue) " +
            "AND (:maxDiscountValue IS NULL OR v.maxDiscountValue = :maxDiscountValue) " +
            "AND (:typeUser IS NULL OR v.typeUser = :typeUser) " +
            "AND v.deleted = false")
    Page<Voucher> findByCodeAndNameAndStartTimeAndEndTimeAndStatusAndPriceAndTypeUser(
            @Param("code") String code,
            @Param("name") String name,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("status") PromotionStatus status,
            @Param("percentageDiscountValue") BigDecimal percentageDiscountValue,
            @Param("fixedDiscountValue") BigDecimal fixedDiscountValue,
            @Param("maxDiscountValue") BigDecimal maxDiscountValue,
            @Param("typeUser") VoucherTypeUser typeUser,
            Pageable pageable);

    Optional<Voucher> findByIdAndDeletedFalse(Integer id);

    @Query("SELECT v FROM Voucher v WHERE v.status = com.example.datnmainpolo.enums.PromotionStatus.COMING_SOON " +
            "AND v.startTime <= :currentTime AND v.deleted = false")
    List<Voucher> findVouchersToActivate(@Param("currentTime") Instant currentTime);

    @Query("SELECT v FROM Voucher v WHERE v.status IN (com.example.datnmainpolo.enums.PromotionStatus.ACTIVE, " +
            "com.example.datnmainpolo.enums.PromotionStatus.COMING_SOON) AND v.endTime < :currentTime AND v.deleted = false")
    List<Voucher> findVouchersToExpire(@Param("currentTime") Instant currentTime);

    List<Voucher> findByEndTimeBeforeAndStatusNot(Instant endTimeBefore, PromotionStatus status);

    List<Voucher> findByStatusInAndDeletedFalse(Collection<PromotionStatus> statuses);

    // Enforce uniqueness by adding stricter conditions
    @Query("SELECT v FROM Voucher v WHERE v.code = :code AND v.deleted = false " +
            "AND v.typeUser = com.example.datnmainpolo.enums.VoucherTypeUser.PUBLIC " +
            "AND v.status = com.example.datnmainpolo.enums.PromotionStatus.ACTIVE")
    Optional<Voucher> findByCodeAndDeletedFalse(@Param("code") String code);

    @Query("SELECT v FROM Voucher v WHERE v.typeUser = :typeUser AND v.status = :status AND v.deleted = false")
    List<Voucher> findByTypeUserAndStatusAndDeletedFalse(VoucherTypeUser typeUser, PromotionStatus status);

    List<Voucher> findByTypeUserAndDeletedFalse(VoucherTypeUser typeUser);


}