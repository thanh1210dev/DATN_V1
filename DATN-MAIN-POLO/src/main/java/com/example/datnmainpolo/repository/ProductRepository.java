package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product,Integer> {
    @Query("SELECT p FROM Product p WHERE p.deleted = false " +
            "AND (:code IS NULL OR p.code LIKE %:code%) " +
            "AND (:name IS NULL OR p.name LIKE %:name%) " +
            "AND (:materialId IS NULL OR p.material.id = :materialId) " +
            "AND (:brandId IS NULL OR p.brand.id = :brandId) " +
            "AND (:categoryId IS NULL OR p.category.id = :categoryId)")
    Page<Product> findAllByFilters(@Param("code") String code,
                                   @Param("name") String name,
                                   @Param("materialId") Integer materialId,
                                   @Param("brandId") Integer brandId,
                                   @Param("categoryId") Integer categoryId,
                                   Pageable pageable);



}
