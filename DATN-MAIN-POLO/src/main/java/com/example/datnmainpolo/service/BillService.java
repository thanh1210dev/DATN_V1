package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.CustomerRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;

import java.math.BigDecimal;
import java.time.Instant;

public interface BillService {
    BillResponseDTO counterSale();
    PaginationResponse<BillResponseDTO> searchBills(String code, OrderStatus status, int page, int size);
    PaginationResponse<BillResponseDTO> searchBillsAdvanced(String code, OrderStatus status, String phoneNumber,
                                                            Instant startDate, Instant endDate, BigDecimal minPrice,
                                                            BigDecimal maxPrice, int page, int size);
    BillResponseDTO addVoucherToBill(Integer billId, String voucherCode);
    BillResponseDTO updateBillStatus(Integer billId, OrderStatus newStatus);
    PaymentResponseDTO processPayment(Integer billId, PaymentType paymentType, BigDecimal amount);
    BillResponseDTO confirmBankingPayment(Integer billId);
    String generateInvoice(Integer billId);
    BillResponseDTO getDetail(Integer billId);
    BillResponseDTO addLoyalCustomerToBill(Integer billId, Integer customerId);
    BillResponseDTO addVisitingGuests(Integer billId, CustomerRequestDTO requestDTO);
    BillResponseDTO addUserToBill(Integer billId, UserRequestDTO userRequestDTO);


    void validateBillForDelivery(Integer billId);

    void applyBestPublicVoucher(Bill savedBill);

    BillResponseDTO convertToBillResponseDTO(Bill savedBill);
}