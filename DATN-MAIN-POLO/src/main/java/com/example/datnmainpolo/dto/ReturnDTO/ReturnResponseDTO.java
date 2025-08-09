package com.example.datnmainpolo.dto.ReturnDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ReturnResponseDTO {
    private Integer id;
    private Integer billId;
    private String status;
    private String reason;
    private Boolean fullReturn;
    private BigDecimal totalRefundAmount;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;
    private List<Item> items;
    private List<String> attachments;

    @Data
    @Builder
    public static class Item {
        private Integer id;
        private Integer billDetailId;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal refundAmount;
    }
}
