package com.example.datnmainpolo.dto.OrderHistoryDTO;

import com.example.datnmainpolo.enums.OrderStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
public class OrderHistoryResponseDTO {
    private Integer id;
    private Integer billId;
    private OrderStatus statusOrder;
    private String actionDescription;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;
    private String createdBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant updatedAt;
    private String updatedBy;

    public OrderHistoryResponseDTO(Integer id, Integer billId, OrderStatus statusOrder, String actionDescription, Instant createdAt, String createdBy, Instant updatedAt, String updatedBy) {
        this.id = id;
        this.billId = billId;
        this.statusOrder = statusOrder;
        this.actionDescription = actionDescription;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public OrderHistoryResponseDTO() {
    }
}