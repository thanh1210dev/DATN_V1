package com.example.datnmainpolo.enums;



public enum OrderStatus {
    PENDING,           // Chờ thanh toán – Đơn hàng vừa tạo, chưa thanh toán
    CONFIRMING,        // Đang xác nhận – Đơn hàng đang được xác nhận bởi cửa hàng
    PAID,              // Đã thanh toán – Thanh toán thành công
    DELIVERING,        // Đang giao hàng – Đơn đã đóng gói và đang vận chuyển
    COMPLETED,         // Hoàn thành – Giao hàng và thanh toán hoàn tất
    CANCELLED,         // Đã hủy – Hủy bởi khách hoặc hệ thống
    RETURNED,          // Đã trả hàng – Khách đã trả hàng
    REFUNDED,          // Đã hoàn tiền – Đã hoàn lại tiền cho khách
    RETURN_COMPLETED   // Đã trả xong – Trả hàng thành công, cập nhật tồn kho
}
