package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.DeliveryBillAddressRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryResponseDTO;
import com.example.datnmainpolo.enums.OrderStatus;

import java.math.BigDecimal;
import java.util.List;

public interface OnlineOrderConfirmationService {
    BillResponseDTO confirmOrder(Integer billId);
    BillResponseDTO addProductToConfirmingOrder(Integer billId, BillDetailCreateDTO request);
    void removeProductFromConfirmingOrder(Integer billDetailId);
    BillResponseDTO updateOrderStatus(Integer billId, OrderStatus newStatus);
    BillResponseDTO revertOrderStatus(Integer billId);
    BillResponseDTO updateCODPaymentAmount(Integer billId, BigDecimal amount);
    BillResponseDTO updateBillAddress(Integer billId, DeliveryBillAddressRequestDTO request);
    List<OrderHistoryResponseDTO> getOrderHistory(Integer billId);

    BillResponseDTO updateCustomerPayment(Integer billId, BigDecimal amount);
}