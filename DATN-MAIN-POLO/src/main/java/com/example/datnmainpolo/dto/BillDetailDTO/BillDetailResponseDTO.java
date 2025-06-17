package com.example.datnmainpolo.dto.BillDetailDTO;

import com.example.datnmainpolo.enums.BillDetailStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDetailResponseDTO {
    private Integer id;

    private Integer billId; // ID của hóa đơn mà chi tiết này thuộc về

    private String billCode;

    private Integer productDetailId;

    private String productName;

    private String productColor;

    private String productSize;

    private String productImage;

    private BigDecimal price;

    private BigDecimal promotionalPrice;

    private Integer quantity;

    private BigDecimal totalPrice;
    
    private BillDetailStatus status; // Trạng thái của sản phẩm trong chi tiết hóa đơn

    private Instant createdAt; // Thời gian tạo chi tiết hóa đơn

    private Instant updatedAt; // Thời gian cập nhật chi tiết hóa đơn

    private String createdBy;

    private String updatedBy;
}
