package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.ProductDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductDetailRepository extends JpaRepository<ProductDetail,Integer> {




    @Query("SELECT pd FROM ProductDetail pd WHERE pd.product.id IN :productIds AND pd.deleted = false")
    List<ProductDetail> findByProductIds(List<Integer> productIds);

    @Query("SELECT pd FROM ProductDetail pd WHERE pd.id IN :productDetailIds AND pd.deleted = false")
    List<ProductDetail> findByIds(List<Integer> productDetailIds);


    Page<ProductDetail> findByDeletedAndProduct_Id(boolean deleted, Integer productId, Pageable pageable);

    @Query("SELECT COUNT(pd) > 0 FROM ProductDetail pd " +
            "WHERE pd.product.id = :productId AND pd.size.id = :sizeId AND pd.color.id = :colorId AND pd.deleted = false")
    boolean existsByProductIdAndSizeIdAndColorId(
            @Param("productId") Integer productId,
            @Param("sizeId") Integer sizeId,
            @Param("colorId") Integer colorId
    );

}
