package com.example.datnmainpolo.dto.BillDetailDTO;

import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.enums.OrderStatus; // Import OrderStatus
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDetailResponseDTO {
    private Integer id;
    private Integer billId;
    private String billCode;
    private Integer productDetailId;
    private String productDetailCode;
    private String productName;
    private String productColor;
    private String productSize;
    private List<ImageDTO> productImage;
    private BigDecimal price;
    private BigDecimal promotionalPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private BillDetailStatus status;
    private OrderStatus typeOrder; // Added typeOrder field
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageDTO {
        private Integer id;
        private String url;
    }
}