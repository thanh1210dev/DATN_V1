package com.example.datnmainpolo.dto.AccountVoucherDTO;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignVoucherRequestDTO {
    @NotNull(message = "ID voucher là bắt buộc")
    private Integer voucherId;

    @NotEmpty(message = "Danh sách ID người dùng không được rỗng")
    private List<Integer> userIds;
}