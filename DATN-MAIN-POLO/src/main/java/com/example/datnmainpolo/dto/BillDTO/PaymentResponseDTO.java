package com.example.datnmainpolo.dto.BillDTO;

import com.example.datnmainpolo.enums.PaymentType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class PaymentResponseDTO {
    private BillResponseDTO bill;  // Thông tin bill
    private PaymentType paymentType;  // Loại thanh toán
    private String qrCode;  // Mã QR (nếu là banking)
    private String bankAccount;  // Số tài khoản (nếu là banking)
    private String bankName;  // Tên ngân hàng (nếu là banking)
    private String accountName;  // Tên chủ tài khoản (nếu là banking)
    private BigDecimal amount;
}
