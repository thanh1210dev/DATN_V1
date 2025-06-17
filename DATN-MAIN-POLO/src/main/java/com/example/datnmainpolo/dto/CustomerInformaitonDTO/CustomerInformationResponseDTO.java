package com.example.datnmainpolo.dto.CustomerInformaitonDTO;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
@Getter
@Setter
public class CustomerInformationResponseDTO {
    private Integer id;
    private String name;
    private String address;
    private Instant createdAt;
    private Instant updatedAt;
}
