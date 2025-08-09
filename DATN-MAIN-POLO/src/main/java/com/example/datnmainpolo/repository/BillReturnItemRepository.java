package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.BillReturnItem;
import com.example.datnmainpolo.enums.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillReturnItemRepository extends JpaRepository<BillReturnItem, Integer> {
    List<BillReturnItem> findByBillReturn_Id(Integer billReturnId);
    // Fetch all return items of a bill to compute returned quantities per BillDetail
    List<BillReturnItem> findByBillReturn_Bill_Id(Integer billId);
    // Only items from returns with a specific status (e.g., COMPLETED)
    List<BillReturnItem> findByBillReturn_Bill_IdAndBillReturn_Status(Integer billId, ReturnStatus status);
}
