package com.example.datnmainpolo.dto.BillDetailDTO;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter
@Setter
public class PaymentWebhookRequestDto {
    /**
     * ID giao dịch duy nhất từ phía ngân hàng/PSP.
     */
    private String transactionId;
    /**
     * Mã tham chiếu hóa đơn của bạn (ví dụ: BillCode), được gửi cho PSP khi tạo QR.
     */
    private String orderReference;
    /**
     * Số tiền của giao dịch.
     */
    private BigDecimal amount;
    /**
     * Loại tiền tệ (ví dụ: "VND").
     */
    private String currency;
    /**
     * Trạng thái cuối cùng của giao dịch từ PSP (ví dụ: "SUCCESS", "FAILED", "PENDING").
     */
    private String status;
    /**
     * Phương thức thanh toán cụ thể được sử dụng (ví dụ: "QR_BANK_A", "MOMO", "VNPAY").
     */
    private String paymentMethod;
    /**
     * Thời gian xảy ra giao dịch theo PSP.
     */
    private LocalDateTime timestamp;
    /**
     * Tên khách hàng (tùy chọn, có thể được PSP gửi về).
     */
    private String customerName;
    /**
     * Thông tin bổ sung từ PSP (ví dụ: nội dung chuyển khoản, thông báo lỗi).
     */
    private String additionalInfo;
}
