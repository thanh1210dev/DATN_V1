package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.AccountVoucherDTO.AccountVoucherAssignDTO;
import com.example.datnmainpolo.dto.AccountVoucherDTO.AccountVoucherResponseDTO;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.service.AccountVoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-vouchers")
public class AccountVoucherController {

    @Autowired
    private AccountVoucherService accountVoucherService;

    // phân hóa đơn cho khách hàng
    @PostMapping("/assign")
    public ResponseEntity<Void> assignVoucherToUsers(@RequestBody AccountVoucherAssignDTO requestDTO) {
        accountVoucherService.assignVoucherToUsers(requestDTO);
        return ResponseEntity.ok().build();
    }
   // dach sách voucher có bao nhiêu người
    @GetMapping("/voucher/{voucherId}")
    public ResponseEntity<PaginationResponse<AccountVoucherResponseDTO>> getUsersByVoucherId(
            @PathVariable Integer voucherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<AccountVoucherResponseDTO> response = accountVoucherService.getUsersByVoucherId(voucherId, page, size);
        return ResponseEntity.ok(response);
    }
   //danh sách người có bao nhiêu voucher
    @GetMapping("/user/{userId}")
    public ResponseEntity<PaginationResponse<AccountVoucherResponseDTO>> getVouchersByUserId(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<AccountVoucherResponseDTO> response = accountVoucherService.getVouchersByUserId(userId, page, size);
        return ResponseEntity.ok(response);
    }
}