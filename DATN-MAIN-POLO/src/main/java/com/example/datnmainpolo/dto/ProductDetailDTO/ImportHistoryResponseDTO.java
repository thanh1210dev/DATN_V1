
        package com.example.datnmainpolo.dto.ProductDetailDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class ImportHistoryResponseDTO {
    private Long id;
    private Integer productDetailId;
    private String productDetailCode;
    private Integer importQuantity;
    private Integer soldQuantity; // Included for frontend display
    private BigDecimal importPrice;
    private BigDecimal publicImportPrice; // Included for frontend display
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant importDate;
}
