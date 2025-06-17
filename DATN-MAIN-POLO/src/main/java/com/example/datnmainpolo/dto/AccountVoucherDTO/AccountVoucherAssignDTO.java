package com.example.datnmainpolo.dto.AccountVoucherDTO;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AccountVoucherAssignDTO {
    private Integer voucherId;
    private List<Integer> userIds;
    private Integer quantity;
}