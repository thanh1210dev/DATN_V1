package com.example.datnmainpolo.dto.CartDetailResponseDTO;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerInformationOnlineRequestDTO {
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


}