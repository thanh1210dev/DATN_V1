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

    // 1. Sản phẩm mới nhất
    @Query(
            value = "SELECT * FROM product WHERE deleted = 0 ORDER BY created_at DESC",
            countQuery = "SELECT count(*) FROM product WHERE deleted = 0",
            nativeQuery = true
    )
    Page<Product> findNewestProducts(Pageable pageable);

    // 2. Sản phẩm khuyến mãi
    @Query(
            value = """
        SELECT DISTINCT p.* FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        WHERE p.deleted = 0
          AND pd.deleted = 0
          AND pd.promotional_price IS NOT NULL
          AND pd.promotional_price < pd.price
        ORDER BY p.created_at DESC
        """,
            countQuery = """
        SELECT count(DISTINCT p.id) FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        WHERE p.deleted = 0
          AND pd.deleted = 0
          AND pd.promotional_price IS NOT NULL
          AND pd.promotional_price < pd.price
        """,
            nativeQuery = true
    )
    Page<Product> findSaleProducts(Pageable pageable);

    // 3. Sản phẩm bán chạy
    @Query(
            value = """
        SELECT p.id, p.code, p.created_at, p.deleted, p.description, p.name, p.updated_at, p.brand_id, p.category_id, p.material_id
        FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        JOIN bill_detail bd ON pd.id = bd.detail_product_id
        WHERE p.deleted = 0 AND pd.deleted = 0 AND bd.deleted = 0
        GROUP BY p.id, p.code, p.created_at, p.deleted, p.description, p.name, p.updated_at, p.brand_id, p.category_id, p.material_id
        ORDER BY SUM(bd.quantity) DESC
        """,
            countQuery = """
        SELECT count(DISTINCT p.id)
        FROM product p
        JOIN product_detail pd ON p.id = pd.product_id
        JOIN bill_detail bd ON pd.id = bd.detail_product_id
        WHERE p.deleted = 0 AND pd.deleted = 0 AND bd.deleted = 0
        """,
            nativeQuery = true
    )
    Page<Product> findBestSellerProducts(Pageable pageable);

}