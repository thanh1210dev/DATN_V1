package com.example.datnmainpolo.dto.BillDetailDTO;

import com.example.datnmainpolo.enums.BillDetailStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BillDetailUpdateDTO {
    private Integer productDetailId;

    private Integer quantity;

    private BillDetailStatus status;
}
