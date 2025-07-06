package com.example.datnmainpolo.dto.BillDTO;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CustomerRequestDTO {
    private String name;

    private String phoneNumber;
}
