package com.example.datnmainpolo.dto.CartDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SelectedItemsRequestDTO {
    private Integer userId;
    private Integer addressId;
    private String paymentType;
    private Integer voucherId;
    private List<Integer> selectedCartDetailIds;
}