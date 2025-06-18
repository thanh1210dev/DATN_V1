package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.enums.PromotionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PromotionProductDetailRepository extends JpaRepository<PromotionProductDetail, Integer> {
    Page<PromotionProductDetail> findByPromotionIdAndDeletedFalse(Integer promotionId, Pageable pageable);

    List<PromotionProductDetail> findByDeletedFalse();

    Page<PromotionProductDetail> findByDeletedFalse(Pageable pageable);

    Optional<PromotionProductDetail> findByIdAndDeletedFalse(Integer id);

    @Query("SELECT ppd FROM PromotionProductDetail ppd JOIN ppd.promotion p WHERE p.status = :status AND ppd.deleted = false")
    Page<PromotionProductDetail> findAllByStatusAndDeletedFalse(PromotionStatus status, Pageable pageable);

    @Query("SELECT ppd FROM PromotionProductDetail ppd JOIN ppd.promotion p WHERE ppd.detailProduct.id = :productDetailId AND p.status = 'ACTIVE' AND ppd.deleted = false")
    List<PromotionProductDetail> findActiveByProductDetailId(Integer productDetailId);

    @Query("SELECT ppd FROM PromotionProductDetail ppd WHERE ppd.promotion.id = :promotionId AND ppd.deleted = false")
    List<PromotionProductDetail> findByPromotionId(Integer promotionId);
}