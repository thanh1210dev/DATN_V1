package com.example.datnmainpolo.dto.ReturnDTO;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateReturnRequest {
    private String reason;
    private Boolean fullReturn;
    private List<ReturnItem> items;
    // When using JSON-only create; for file uploads, controller will accept multipart separately
    private List<String> attachmentUrls; // optional: pre-uploaded URLs if any

    @Data
    public static class ReturnItem {
        private Integer billDetailId;
        private Integer quantity;
        private BigDecimal unitPrice; // optional, server can compute
    }
}
