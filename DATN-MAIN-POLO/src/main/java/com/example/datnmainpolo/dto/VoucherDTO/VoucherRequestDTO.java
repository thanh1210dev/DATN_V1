package com.example.datnmainpolo.dto.VoucherDTO;

import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.VoucherType;
import com.example.datnmainpolo.enums.VoucherTypeUser;
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
    @DecimalMax(value = "999000000000.00", message = "Giá trị giảm cố định tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal fixedDiscountValue;

    @DecimalMin(value = "0.00", message = "Phần trăm giảm giá phải ít nhất là 0%")
    @DecimalMax(value = "100.00", message = "Phần trăm giảm giá không được vượt quá 100%")
    private BigDecimal percentageDiscountValue;

    @PositiveOrZero(message = "Giá trị giảm tối đa phải không âm")
    @DecimalMax(value = "999000000000.00", message = "Giá trị giảm tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal maxDiscountValue;

    @PositiveOrZero(message = "Giá trị đơn hàng tối thiểu phải không âm")
    @DecimalMax(value = "999000000000.00", message = "Giá trị đơn hàng tối thiểu tối đa 999 tỷ")
    @Digits(integer = 12, fraction = 2, message = "Tối đa 12 số phần nguyên và 2 số thập phân")
    private BigDecimal minOrderValue;

    @NotNull(message = "ID người tạo là bắt buộc")
    private Integer createdByUserId;

    @NotNull(message = "Loại người dùng là bắt buộc")
    private VoucherTypeUser typeUser; // New field
}