package com.example.datnmainpolo.dto.AccountVoucherDTO;

import com.example.datnmainpolo.enums.PromotionStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class AccountVoucherResponseDTO {
    private Integer id;
    private Integer voucherId;
    private Integer accountId;
    private String voucherName;
    private Integer quantity;
    private String voucherStatus;
    private String accountName;
    private Boolean status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")

    private Instant createdAt;


}