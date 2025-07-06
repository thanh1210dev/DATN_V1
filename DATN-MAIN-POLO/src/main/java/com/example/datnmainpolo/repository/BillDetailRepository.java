package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.enums.BillDetailStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillDetailRepository extends JpaRepository<BillDetail, Integer> {
    Page<BillDetail> findByBillIdAndDeletedFalse(Integer billId, Pageable pageable);
    Optional<BillDetail> findByBillIdAndDetailProduct_Id(Integer billId, Integer productDetailId);
    List<BillDetail> findAllByBillIdAndDeletedFalse(Integer billId); // New method

    List<BillDetail> findByBillId(Integer billId);

    BillDetail findByBill_Id(Integer billId);
}