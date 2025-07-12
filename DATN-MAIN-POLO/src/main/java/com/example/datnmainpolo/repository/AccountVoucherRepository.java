package com.example.datnmainpolo.repository;


import com.example.datnmainpolo.entity.AccountVoucher;
import com.example.datnmainpolo.enums.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccountVoucherRepository extends JpaRepository<AccountVoucher, Integer> {
    Page<AccountVoucher> findAllByStatusAndDeletedFalse(PromotionStatus status, Pageable pageable);

    @Query("SELECT av FROM AccountVoucher av WHERE av.voucher.id = :voucherId AND av.deleted = false")
    Page<AccountVoucher> findByVoucherId(@Param("voucherId") Integer voucherId, Pageable pageable);

    @Query("SELECT av FROM AccountVoucher av WHERE av.userEntity.id = :userId AND av.deleted = false")
    Page<AccountVoucher> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    boolean existsByVoucherIdAndUserEntityIdAndDeletedFalse(Integer voucherId, Integer userId);


    List<AccountVoucher> findByUserEntityIdAndStatusTrueAndDeletedFalse(Integer userId);
}