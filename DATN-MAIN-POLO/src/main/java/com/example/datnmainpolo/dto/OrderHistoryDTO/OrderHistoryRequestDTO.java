package com.example.datnmainpolo.dto.OrderHistoryDTO;

import com.example.datnmainpolo.enums.OrderStatus;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderHistoryRequestDTO {
    private Integer billId;

    private OrderStatus statusOrder;

    @Size(max = 1000)
    private String actionDescription;

}
