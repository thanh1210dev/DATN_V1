package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.OrderHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderHistoryRepository extends JpaRepository<OrderHistory, Integer> {
    Page<OrderHistory> findAllByDeletedFalse(Pageable pageable);
    List<OrderHistory> findByBillIdAndDeletedFalseOrderByCreatedAtDesc(Integer billId);
}
