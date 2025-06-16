package com.example.datnmainpolo.dto.PromotionProductDetailDTO;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignPromotionRequest {
    private Integer promotionId;
    private List<Integer> productIds; // Phân theo sản phẩm
    private List<Integer> productDetailIds; // Phân riêng lẻ
}