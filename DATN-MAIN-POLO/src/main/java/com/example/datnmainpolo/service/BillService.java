package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.BillRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BillService {
    PaginationResponse<BillResponseDTO> getAllByStatusAndDeletedFalse(OrderStatus orderStatus, int page, int size);
    PaginationResponse<BillResponseDTO> findAllByCustomerIdAndDeletedFalse(Integer customerId, int page, int size);
    BillResponseDTO createBillAdmin(BillRequestDTO request);
    BillResponseDTO updateBillAdmin(Integer billId, BillRequestDTO request);
    void deleteBill(Integer billId);
}
