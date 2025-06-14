package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Color;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ColorRepository extends JpaRepository<Color,Integer> {
    Page<Color> findAllByDeletedFalse(Pageable pageable);
}
