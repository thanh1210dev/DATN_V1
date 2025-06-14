package com.example.datnmainpolo.enums;

public enum ReturnStatus {
    REQUESTED,  // Yêu cầu trả – Khách gửi yêu cầu trả
    APPROVED,   // Đã duyệt – Admin duyệt yêu cầu trả
    REJECTED,   // Từ chối – Từ chối yêu cầu trả
    COMPLETED   // Trả thành công – Hoàn tất quy trình trả hàng
}
