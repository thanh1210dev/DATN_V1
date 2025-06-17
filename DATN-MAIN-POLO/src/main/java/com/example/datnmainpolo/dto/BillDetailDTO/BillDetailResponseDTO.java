package com.example.datnmainpolo.dto.BillDetailDTO;

import com.example.datnmainpolo.enums.BillDetailStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
public class BillDetailResponseDTO {
    private Integer id; // ID của BillDetail

    private Integer productDetailId;

    private String productName; // Tên sản phẩm (Lấy từ Product hoặc ProductDetail)

    private Integer quantity; // Số lượng sản phẩm trong chi tiết hóa đơn

    private BigDecimal price; // Giá của sản phẩm

    private BigDecimal promotionalPrice; // Giá giảm sau khi áp dụng giảm giá

    private BillDetailStatus status; // Trạng thái của sản phẩm trong chi tiết hóa đơn

    private BigDecimal totalPrice; // Tổng tiền (Giá * Số lượng)

    private Integer billId; // ID của hóa đơn mà chi tiết này thuộc về

    private Instant createdAt; // Thời gian tạo chi tiết hóa đơn

    private Instant updatedAt; // Thời gian cập nhật chi tiết hóa đơn


}
