package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SizeRepository extends JpaRepository<Size,Integer> {
    Page<Size> findAllByDeletedFalse(Pageable pageable);
}
