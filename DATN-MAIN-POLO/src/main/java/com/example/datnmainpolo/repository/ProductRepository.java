package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product,Integer> {
    Page<Product> findAllByDeletedFalse(Pageable pageable);
}
