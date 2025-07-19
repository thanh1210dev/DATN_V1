package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Color;
import com.example.datnmainpolo.entity.ImportHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;

public interface ImportHistoryRepository extends JpaRepository<ImportHistory, Long> {
    Page<ImportHistory> findByProductDetailId(Integer productDetailId, Pageable pageable);

    @Query("SELECT ih FROM ImportHistory ih " +
            "WHERE (:startDate IS NULL OR ih.importDate >= :startDate) " +
            "AND (:endDate IS NULL OR ih.importDate <= :endDate) " +
            "AND (:minPrice IS NULL OR ih.importPrice >= :minPrice) " +
            "AND (:maxPrice IS NULL OR ih.importPrice <= :maxPrice) " +
            "AND (:code IS NULL OR LOWER(ih.productDetail.code) LIKE LOWER(CONCAT('%', :code, '%')))")
    Page<ImportHistory> findAllWithFilters(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("code") String code,
            Pageable pageable);


}