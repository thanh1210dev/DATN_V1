package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.*;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.User;

public interface BillService {
    BillResponseDTO counterSale();
    PaginationResponse<BillResponseDTO> searchBills(String code,OrderStatus status, int page, int size);
    
    BillResponseDTO addVoucherToBill(Integer billId, String voucherCode);
    //cap nhat trang thai bill
    BillResponseDTO updateBillStatus(Integer billId, OrderStatus newStatus);

    PaymentResponseDTO processPayment(Integer billId, PaymentType paymentType, BigDecimal amount);

    BillResponseDTO confirmBankingPayment(Integer billId);
}
