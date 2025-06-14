package com.example.datnmainpolo.dto.ShirtCollarDTO;


import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ShirtCollarResponseDTO {
    private Integer id;
    private String code;
    private String name;
    private Instant createdAt;
    private Instant updatedAt;
}