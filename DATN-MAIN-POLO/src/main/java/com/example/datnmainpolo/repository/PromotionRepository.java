package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Promotion;
import com.example.datnmainpolo.enums.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    @Query("SELECT p FROM Promotion p WHERE " +
            "(:code IS NULL OR p.code LIKE CONCAT('%', :code, '%')) " +
            "AND (:startTime IS NULL OR p.startTime >= :startTime) " +
            "AND (:endTime IS NULL OR p.endTime <= :endTime) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "AND p.deleted = false")
    Page<Promotion> findByCodeAndStartTimeAndEndTimeAndStatus(
            @Param("code") String code,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("status") PromotionStatus status,
            Pageable pageable);



    Optional<Promotion> findByIdAndDeletedFalse(Integer id);

    @Query("SELECT p FROM Promotion p WHERE p.deleted = false AND " +
            "((p.startTime <= :endTime AND p.endTime >= :startTime) OR " +
            "(p.startTime >= :startTime AND p.endTime <= :endTime))")
    List<Promotion> findOverlappingPromotions(Instant startTime, Instant endTime);





    @Query("SELECT p FROM Promotion p WHERE p.status = com.example.datnmainpolo.enums.PromotionStatus.COMING_SOON AND p.startTime <= :currentTime AND p.deleted = false")
    List<Promotion> findPromotionsToActivate(@Param("currentTime") Instant currentTime);

    @Query("SELECT p FROM Promotion p WHERE p.status IN (com.example.datnmainpolo.enums.PromotionStatus.ACTIVE, com.example.datnmainpolo.enums.PromotionStatus.COMING_SOON) AND p.endTime < :currentTime AND p.deleted = false")
    List<Promotion> findPromotionsToExpire(@Param("currentTime") Instant currentTime);


    Optional<Promotion> findByCodeAndDeletedFalse(String newCode);

    List<Promotion> findByEndTimeBeforeAndStatusNot(Instant endTimeBefore, PromotionStatus status);

    List<Promotion> findByStatusInAndDeletedFalse(Collection<PromotionStatus> statuses);





    Optional<Promotion> findByIdAndStatus(Integer id, PromotionStatus status);

    @Query("SELECT p FROM Promotion p WHERE p.endTime <= :now AND p.status = :status")
    List<Promotion> findByEndTimeBeforeAndStatus(Instant now, PromotionStatus status);
}