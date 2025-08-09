package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.BillReturn;
import com.example.datnmainpolo.enums.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillReturnRepository extends JpaRepository<BillReturn, Integer> {
    List<BillReturn> findByBill_Id(Integer billId);
    boolean existsByBill_IdAndStatus(Integer billId, ReturnStatus status);
}
