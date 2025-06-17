package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
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
    Page<BillDetail> findAllByStatusAndDeletedFalse(BillDetailStatus status, Pageable pageable);

    Optional<BillDetail> findByBillIdAndDetailProductId(Integer billId, Integer productDetailId);

    Page<BillDetail> findByBillIdAndDeletedFalse(Integer billId, Pageable pageable);

    List<BillDetail> findByBillId(Integer billId);
}
