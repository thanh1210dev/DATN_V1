package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.ProductDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductDetailRepository extends JpaRepository<ProductDetail, Integer> {

    @Query("SELECT pd FROM ProductDetail pd WHERE pd.product.id IN :productIds AND pd.deleted = false")
    List<ProductDetail> findByProductIds(@Param("productIds") List<Integer> productIds);

    @Query("SELECT pd FROM ProductDetail pd WHERE pd.id IN :productDetailIds AND pd.deleted = false")
    List<ProductDetail> findByIds(@Param("productDetailIds") List<Integer> productDetailIds);

    Page<ProductDetail> findByDeletedAndProduct_Id(boolean deleted, Integer productId, Pageable pageable);

    @Query("SELECT COUNT(pd) > 0 FROM ProductDetail pd " +
            "WHERE pd.product.id = :productId AND pd.size.id = :sizeId AND pd.color.id = :colorId AND pd.deleted = false")
    boolean existsByProductIdAndSizeIdAndColorId(
            @Param("productId") Integer productId,
            @Param("sizeId") Integer sizeId,
            @Param("colorId") Integer colorId
    );

    Page<ProductDetail> findByDeleted(Boolean deleted, Pageable pageable);

    @Query("SELECT pd FROM ProductDetail pd " +
            "WHERE pd.deleted = false " +
            "AND (:code IS NULL OR LOWER(pd.code) LIKE LOWER(CONCAT('%', :code, '%'))) " +
            "AND (:name IS NULL OR LOWER(pd.product.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
            "AND (:price IS NULL OR pd.price = :price) " +
            "AND (:sizeId IS NULL OR pd.size.id = :sizeId) " +
            "AND (:colorId IS NULL OR pd.color.id = :colorId)")
    Page<ProductDetail> findByFilters(
            @Param("code") String code,
            @Param("name") String name,
            @Param("price") BigDecimal price,
            @Param("sizeId") Integer sizeId,
            @Param("colorId") Integer colorId,
            Pageable pageable
    );

    // Lấy danh sách kích thước khả dụng cho một sản phẩm
    @Query("SELECT DISTINCT pd.size FROM ProductDetail pd WHERE pd.product.id = :productId AND pd.deleted = false")
    List<com.example.datnmainpolo.entity.Size> findAvailableSizesByProductId(@Param("productId") Integer productId);

    // Lấy danh sách màu sắc khả dụng cho một sản phẩm, có thể lọc theo sizeId
    @Query("SELECT DISTINCT pd.color FROM ProductDetail pd " +
            "WHERE pd.product.id = :productId AND pd.deleted = false " +
            "AND (:sizeId IS NULL OR pd.size.id = :sizeId)")
    List<com.example.datnmainpolo.entity.Color> findAvailableColorsByProductIdAndSizeId(
            @Param("productId") Integer productId,
            @Param("sizeId") Integer sizeId
    );

    // Lấy chi tiết sản phẩm dựa trên productId, sizeId, colorId
    @Query("SELECT pd FROM ProductDetail pd " +
            "WHERE pd.product.id = :productId AND pd.size.id = :sizeId AND pd.color.id = :colorId AND pd.deleted = false")
    ProductDetail findByProductIdAndSizeIdAndColorId(
            @Param("productId") Integer productId,
            @Param("sizeId") Integer sizeId,
            @Param("colorId") Integer colorId
    );
}