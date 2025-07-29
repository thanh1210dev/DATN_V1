package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.util.Map;

public interface VNPayService {
    String createPaymentUrl(Integer billId, BigDecimal amount, String orderInfo, HttpServletRequest request);
    PaymentResponseDTO processVNPayCallback(Map<String, String> params);
    boolean verifyPayment(Map<String, String> params);
}
