package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.CustomerInformation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerInformationRepository extends JpaRepository<CustomerInformation, Integer> {
    Page<CustomerInformation> findAllByDeletedFalse(Pageable pageable);
}
