package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Brand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand,Integer> {
    Page<Brand> findAllByDeletedFalse(Pageable pageable);
}
