package com.example.datnmainpolo.dto.CartDetailResponseDTO;


import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;
import com.example.datnmainpolo.enums.OrderStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
public class CartDetailResponseDTO {
    private Integer id;
    private Integer cartId;
    private Integer productDetailId;
    private String productName;
    private String productColor;
    private String productSize;
    private Integer quantity;
    private Integer availableQuantity; // Số lượng còn lại trong kho
    private BigDecimal price;
    private BigDecimal totalPrice;
    private List<CartDetailResponseDTO.ImageDTO> images;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder
    @Getter
    @Setter
    public static class ImageDTO {
        private Integer id;
        private String url;
    }
}