package com.example.datnmainpolo.dto.OrderHistoryDTO;

import com.example.datnmainpolo.enums.OrderStatus;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;


@Getter
@Setter

public class OrderHistoryResponseDTO {
    private Integer id;

    private Integer billId;

    private OrderStatus statusOrder;

    private String actionDescription;

    private Instant createdAt;

    private Instant updatedAt;
}
