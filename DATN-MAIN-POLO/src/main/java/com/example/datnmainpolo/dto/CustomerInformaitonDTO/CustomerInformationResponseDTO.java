package com.example.datnmainpolo.dto.CustomerInformaitonDTO;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Builder
@Getter
@Setter
//@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomerInformationResponseDTO {
    private Integer id;
    private String name;
    private String phoneNumber;
    private String address;
    private String provinceName;
    private Integer provinceId;
    private String districtName;
    private Integer districtId;
    private String wardName;
    private String wardCode;
    private Boolean isDefault;
    private Instant createdAt;
    private Instant updatedAt;
}