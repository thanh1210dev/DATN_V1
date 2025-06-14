package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.ShirtCollar;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShirtCollarRepository extends JpaRepository<ShirtCollar,Integer> {

    Page<ShirtCollar> findAllByDeletedFalse(Pageable pageable);


}
