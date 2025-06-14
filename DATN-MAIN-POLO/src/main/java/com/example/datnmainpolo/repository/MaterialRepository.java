package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material, Integer> {
    Page<Material> findAllByDeletedFalse(Pageable pageable);
}
