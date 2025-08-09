package com.example.datnmainpolo.enums;

public enum FulfillmentStatus {
    PENDING,      // Chờ xử lý
    CONFIRMING,   // Đang xác nhận
    CONFIRMED,    // Đã xác nhận
    PACKED,       // Đã đóng gói
    DELIVERING,   // Đang giao hàng
    DELIVERED,    // Đã giao hàng
    DELIVERY_FAILED, // Giao hàng thất bại
    RETURN_REQUESTED, // Khách yêu cầu trả hàng
    RETURNED,     // Đã nhận hàng trả về kho
    RETURN_COMPLETED, // Hoàn tất trả hàng
    CANCELLED,    // Đã hủy
    COMPLETED     // Hoàn thành
}
