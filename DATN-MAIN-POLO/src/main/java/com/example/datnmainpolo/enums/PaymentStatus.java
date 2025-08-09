package com.example.datnmainpolo.enums;

public enum PaymentStatus {
    UNPAID,        // Chưa thanh toán (COD trước khi giao, tạo đơn online chưa trả)
    PENDING,       // Đang chờ thanh toán (VNPay/Banking chờ callback)
    PAID,          // Đã thanh toán
    FAILED,        // Thanh toán thất bại
    REFUNDED,      // Đã hoàn tiền toàn bộ
    PARTIALLY_REFUNDED // Đã hoàn tiền một phần
}
