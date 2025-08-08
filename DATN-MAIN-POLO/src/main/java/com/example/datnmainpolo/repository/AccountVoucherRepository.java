package com.example.datnmainpolo.repository;


import com.example.datnmainpolo.entity.AccountVoucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AccountVoucherRepository extends JpaRepository<AccountVoucher, Integer> {
    Page<AccountVoucher> findAllByStatusAndDeletedFalse(PromotionStatus status, Pageable pageable);

    @Query("SELECT av FROM AccountVoucher av WHERE av.voucher.id = :voucherId AND av.deleted = false")
    Page<AccountVoucher> findByVoucherId(@Param("voucherId") Integer voucherId, Pageable pageable);

    @Query("SELECT av FROM AccountVoucher av WHERE av.userEntity.id = :userId AND av.deleted = false")
    Page<AccountVoucher> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    boolean existsByVoucherIdAndUserEntityIdAndDeletedFalse(Integer voucherId, Integer userId);

    AccountVoucher findByUserEntityIdAndVoucherIdAndDeletedFalse(Integer userId, Integer voucherId);

    List<AccountVoucher> findByUserEntityIdAndStatusTrueAndDeletedFalse(Integer userId);

    List<AccountVoucher> findByUserEntityIdAndDeletedFalse(Integer userId);

// show voucher trong client la private
    @Query("SELECT av FROM AccountVoucher av " +
       "JOIN FETCH av.voucher v " +
       "WHERE av.userEntity.id = :userId " +
       "AND av.status = false " +
       "AND av.deleted = false " +
       "AND av.quantity > 0 " +
       "AND v.status = com.example.datnmainpolo.enums.PromotionStatus.ACTIVE " +
       "AND v.deleted = false " +
       "AND (v.endTime IS NULL OR v.endTime > :now) " +
       "AND (v.startTime IS NULL OR v.startTime <= :now) " +
       "AND v.typeUser = com.example.datnmainpolo.enums.VoucherTypeUser.PRIVATE")
List<AccountVoucher> findAvailablePrivateVouchersForUser(@Param("userId") Integer userId, @Param("now") Instant now);

// Lấy voucher PRIVATE của user theo code
@Query("SELECT av FROM AccountVoucher av " +
       "JOIN FETCH av.voucher v " +
       "WHERE av.userEntity.id = :userId " +
       "AND av.status = false " +
       "AND av.deleted = false " +
       "AND av.quantity > 0 " +
       "AND v.status = com.example.datnmainpolo.enums.PromotionStatus.ACTIVE " +
       "AND v.deleted = false " +
       "AND (v.endTime IS NULL OR v.endTime > :now) " +
       "AND (v.startTime IS NULL OR v.startTime <= :now) " +
       "AND v.typeUser = com.example.datnmainpolo.enums.VoucherTypeUser.PRIVATE " +
       "AND v.code = :code")
AccountVoucher findPrivateVoucherByUserAndCode(@Param("userId") Integer userId, @Param("code") String code, @Param("now") Instant now);


}