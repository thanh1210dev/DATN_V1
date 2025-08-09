package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.Checkout.GuestOrderRequestDTO;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.service.GuestCheckoutService;
import com.example.datnmainpolo.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/guest-checkout")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:63342"}, allowCredentials = "true")
public class GuestCheckoutController {

    private final GuestCheckoutService guestCheckoutService;
    private final VNPayService vnpayService;

    @PostMapping("/order")
    public ResponseEntity<?> createGuestOrder(@RequestBody GuestOrderRequestDTO request, HttpServletRequest httpRequest) {
        BillResponseDTO dto = guestCheckoutService.createOrder(request);
        // Nếu là VNPAY: tạo URL thanh toán và trả về trực tiếp để FE redirect
        if (request.getPaymentType() == PaymentType.VNPAY) {
            String orderInfo = "Thanh toan don hang #" + dto.getId();
            String paymentUrl = vnpayService.createPaymentUrl(dto.getId(), dto.getFinalAmount(), orderInfo, httpRequest);
            return ResponseEntity.ok(paymentUrl);
        }
        // COD: trả về bill để FE điều hướng vào trang đơn hàng
        return ResponseEntity.ok(dto);
    }
}
