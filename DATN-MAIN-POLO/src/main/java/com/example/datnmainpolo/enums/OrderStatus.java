package com.example.datnmainpolo.enums;



public enum OrderStatus {
    PENDING,           // Chờ thanh toán – Đơn hàng vừa tạo, chưa thanh toán
    CONFIRMING,        // Đang xác nhận – Đơn hàng đang được xác nhận bởi cửa hàng
    CONFIRMED,         // Đã xác nhận – Đơn đã được xác nhận bởi cửa hàng
    PACKED,            // Đã đóng gói – Đơn đã được chuẩn bị, sẵn sàng giao
    DELIVERING,        // Đang giao hàng – Đơn đã đóng gói và đang vận chuyển
    PAID,              // Đã thanh toán – Thanh toán thành công
    DELIVERED,         // Đã giao – Giao thành công cho khách
    COMPLETED,         // Hoàn thành – Giao hàng và thanh toán hoàn tất
    CANCELLED,         // Đã hủy – Hủy bởi khách hoặc hệ thống
    RETURN_REQUESTED,  // Yêu cầu trả hàng – Khách yêu cầu trả hàng
    RETURNED,          // Đã trả hàng – Khách đã trả hàng
    REFUNDED,          // Đã hoàn tiền – Đã hoàn lại tiền cho khách
    RETURN_COMPLETED,  // Đã trả xong – Trả hàng thành công, cập nhật tồn kho
    DELIVERY_FAILED    // Giao hàng thất bại – Giao hàng không thành công (ví dụ: khách không nhận)
}
