package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.enums.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PromotionProductDetailRepository extends JpaRepository<PromotionProductDetail,Integer> {
    List<PromotionProductDetail> findByPromotionIdAndDeletedFalse(Integer promotionId);

    List<PromotionProductDetail> findByDeletedFalse();


    Page<PromotionProductDetail> findByDeletedFalse(Pageable pageable);

    Optional<PromotionProductDetail> findByIdAndDeletedFalse(Integer id);
    @Query("SELECT ppd FROM PromotionProductDetail ppd JOIN ppd.promotion p WHERE p.status = :status AND ppd.deleted = false")
    Page<PromotionProductDetail> findAllByStatusAndDeletedFalse(PromotionStatus status, Pageable pageable);

}
