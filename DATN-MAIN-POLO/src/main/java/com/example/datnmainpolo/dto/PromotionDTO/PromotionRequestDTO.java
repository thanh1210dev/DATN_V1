package com.example.datnmainpolo.dto.PromotionDTO;


import com.example.datnmainpolo.enums.DiscountType;
import com.example.datnmainpolo.enums.PromotionStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class PromotionRequestDTO {

    private String code;

    @NotBlank(message = "Tên khuyến mãi không được để trống")
    @Size(max = 100, message = "Tên khuyến mãi không được vượt quá 100 ký tự")
    private String name;

    @NotNull(message = "Loại khuyến mãi là bắt buộc")
    private DiscountType typePromotion;

    private Instant startTime;

    private Instant endTime;

    @PositiveOrZero(message = "Giá trị giảm cố định phải không âm")
    private BigDecimal fixedDiscountValue; // Giá trị giảm cố định

    @DecimalMin(value = "0.00", message = "Phần trăm giảm giá phải ít nhất là 0%")
    @DecimalMax(value = "100.00", message = "Phần trăm giảm giá không được vượt quá 100%")
    private BigDecimal percentageDiscountValue; // Giá trị giảm theo phần trăm

    @PositiveOrZero(message = "Giá trị giảm tối đa phải không âm")
    private BigDecimal maxDiscountValue; // Giá trị giảm tối đa

    @PositiveOrZero(message = "Giá trị đơn hàng tối thiểu phải không âm") // New validation
    private BigDecimal minOrderValue; // Giá trị đơn hàng tối thiểu

    private String description;

    @NotNull(message = "Trạng thái là bắt buộc")
    private PromotionStatus status;

    @NotNull(message = "ID người tạo là bắt buộc")
    private Integer createdByUserId;
}