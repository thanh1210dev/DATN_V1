package com.example.datnmainpolo.dto.BillDetailDTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class BillDetailCreateDTO {
    @NotNull(message = "productDetailId không được để trống")
    private Integer productDetailId;

    @Min(value = 1, message = "Số lượng phải >= 1")
    private Integer quantity; // Cho phép null để backend tự default =1 nếu thiếu
}
