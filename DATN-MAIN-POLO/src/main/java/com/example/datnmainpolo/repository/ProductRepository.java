package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Map;

public interface ProductRepository extends JpaRepository<Product, Integer> {
    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN p.material m " +
            "LEFT JOIN p.brand b " +
            "LEFT JOIN p.category c " +
            "LEFT JOIN ProductDetail pd ON p.id = pd.product.id " +
            "WHERE (:code IS NULL OR p.code LIKE CONCAT('%', :code, '%')) " +
            "AND (:name IS NULL OR p.name LIKE CONCAT('%', :name, '%')) " +
            "AND (:materialId IS NULL OR m.id = :materialId) " +
            "AND (:brandId IS NULL OR b.id = :brandId) " +
            "AND (:categoryId IS NULL OR c.id = :categoryId) " +
            "AND (:minPrice IS NULL OR pd.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR pd.price <= :maxPrice) " +
            "AND p.deleted = false")
    Page<Product> findAllByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("materialId") Integer materialId,
            @Param("brandId") Integer brandId,
            @Param("categoryId") Integer categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );



    @Query("SELECT new map(MIN(pd.price) as minPrice, MAX(pd.price) as maxPrice) " +
            "FROM ProductDetail pd WHERE pd.product.id = :productId AND pd.deleted = false")
    Map<String, BigDecimal> findMinMaxPriceByProductId(@Param("productId") Integer productId);
}