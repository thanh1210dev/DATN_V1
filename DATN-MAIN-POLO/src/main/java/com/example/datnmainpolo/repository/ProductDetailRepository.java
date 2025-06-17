package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.ProductDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductDetailRepository extends JpaRepository<ProductDetail,Integer> {
    Page<ProductDetail> findByDeletedAndProduct_Id(Boolean deleted, int id,Pageable pageable);



    @Query("SELECT pd FROM ProductDetail pd WHERE pd.product.id IN :productIds AND pd.deleted = false")
    List<ProductDetail> findByProductIds(List<Integer> productIds);

    @Query("SELECT pd FROM ProductDetail pd WHERE pd.id IN :productDetailIds AND pd.deleted = false")
    List<ProductDetail> findByIds(List<Integer> productDetailIds);

}
