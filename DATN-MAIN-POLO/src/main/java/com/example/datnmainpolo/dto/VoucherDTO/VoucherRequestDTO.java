package com.example.datnmainpolo.dto.VoucherDTO;
// package com.example.datnmainpolo.dto.VoucherDTO;

import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class VoucherRequestDTO {

    private String code;

    @NotBlank(message = "Tên voucher không được để trống")
    @Size(max = 100, message = "Tên voucher không được vượt quá 100 ký tự")
    private String name;

    @NotNull(message = "Loại voucher là bắt buộc")
    private VoucherType type;

    @NotNull(message = "Thời gian bắt đầu là bắt buộc")
    private Instant startTime;

    @NotNull(message = "Thời gian kết thúc là bắt buộc")
    private Instant endTime;

    @PositiveOrZero(message = "Số lượng voucher phải không âm")
    private Integer quantity;

    @NotNull(message = "Trạng thái là bắt buộc")
    private PromotionStatus status;

    @PositiveOrZero(message = "Giá trị giảm cố định phải không âm")
    private BigDecimal fixedDiscountValue; // Giá trị giảm cố định

    @DecimalMin(value = "0.00", message = "Phần trăm giảm giá phải ít nhất là 0%")
    @DecimalMax(value = "100.00", message = "Phần trăm giảm giá không được vượt quá 100%")
    private BigDecimal percentageDiscountValue; // Giá trị giảm theo phần trăm

    @PositiveOrZero(message = "Giá trị giảm tối đa phải không âm")
    private BigDecimal maxDiscountValue; // Giá trị giảm tối đa

    @PositiveOrZero(message = "Giá trị đơn hàng tối thiểu phải không âm") // New validation
    private BigDecimal minOrderValue; // Giá trị đơn hàng tối thiểu

    @NotNull(message = "ID người tạo là bắt buộc")
    private Integer createdByUserId;
}