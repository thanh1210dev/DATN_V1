package com.example.datnmainpolo.enums;


public enum PromotionStatus {
    COMING_SOON, // Sắp ra mắt – Chưa bắt đầu, sẽ áp dụng trong tương lai
    ACTIVE,      // Đang hoạt động – Đủ điều kiện áp dụng
    EXPIRED,     // Hết hạn – Ngoài thời gian hiệu lực
    USED_UP,     // Hết lượt – Đã sử dụng hết số lượt
    INACTIVE     // Không hoạt động – Admin vô hiệu hoá
}
