package com.example.datnmainpolo.repository;

import com.example.datnmainpolo.entity.BillReturnAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillReturnAttachmentRepository extends JpaRepository<BillReturnAttachment, Integer> {
    List<BillReturnAttachment> findByBillReturn_Id(Integer billReturnId);
}
