package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Page<Category> findAllByDeletedFalse(Pageable pageable);
    boolean existsByCodeAndDeletedFalse(String code);
}
