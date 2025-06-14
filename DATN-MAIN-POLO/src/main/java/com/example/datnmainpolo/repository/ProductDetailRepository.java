package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.ProductDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductDetailRepository extends JpaRepository<ProductDetail,Integer> {
    Page<ProductDetail> findByDeleted(Boolean deleted, Pageable pageable);
}
