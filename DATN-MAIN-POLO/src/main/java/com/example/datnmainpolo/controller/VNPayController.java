package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.config.VNPAYConfig;
import com.example.datnmainpolo.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:63342", "null"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class VNPayController {
    private static final Logger LOGGER = LoggerFactory.getLogger(VNPayController.class);

    private final VNPayService vnpayService;
    private final VNPAYConfig vnpayConfig;

    @GetMapping("/callback")
    public void vnpayCallback(@RequestParam Map<String, String> params,
                              HttpServletResponse response) throws IOException {
        LOGGER.info("Received VNPay callback with params: {}", params);
        String billId = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");

        try {
            // URL cơ sở để redirect về frontend
            String baseUrl = vnpayConfig.getPaymentBackReturnUrl();
            UriComponentsBuilder urlBuilder;

            // Xác thực chữ ký trước khi xử lý
            if (vnpayService.verifyPayment(params)) {
                if ("00".equals(responseCode)) {
                    // Payment successful
                    LOGGER.info("VNPay payment successful for bill {}", billId);
                    vnpayService.processVNPayCallback(params); // Xử lý nghiệp vụ

                    urlBuilder = UriComponentsBuilder.fromUriString(baseUrl)
                            .queryParam("status", "success")
                            .queryParam("billId", billId);
                } else {
                    // Payment failed - MUST process callback to update bill status
                    LOGGER.warn("VNPay payment failed for bill {} with response code {}", billId, responseCode);
                    
                    // Process callback to update bill status to CANCELLED
                    try {
                        vnpayService.processVNPayCallback(params);
                    } catch (Exception callbackException) {
                        // Even if callback processing fails, we still need to redirect user
                        LOGGER.error("Failed to process VNPay callback for failed payment", callbackException);
                    }
                    
                    urlBuilder = UriComponentsBuilder.fromUriString(baseUrl)
                            .queryParam("status", "failed")
                            .queryParam("billId", billId)
                            .queryParam("error", responseCode);
                }
            } else {
                // Invalid signature
                LOGGER.error("Invalid VNPay signature for bill {}", billId);
                urlBuilder = UriComponentsBuilder.fromUriString(baseUrl)
                        .queryParam("status", "error")
                        .queryParam("billId", billId)
                        .queryParam("message", "Invalid signature");
            }
            response.sendRedirect(urlBuilder.toUriString());

        } catch (Exception e) {
            LOGGER.error("Error processing VNPay callback for bill {}", billId, e);
            String errorRedirectUrl = UriComponentsBuilder.fromUriString(vnpayConfig.getPaymentBackReturnUrl())
                    .queryParam("status", "error")
                    .queryParam("billId", billId)
                    .queryParam("message", "System error during callback processing")
                    .toUriString();
            response.sendRedirect(errorRedirectUrl);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Boolean> verifyPayment(@RequestBody Map<String, String> params) {
        LOGGER.info("Verifying VNPay payment");
        
        try {
            boolean isValid = vnpayService.verifyPayment(params);
            return ResponseEntity.ok(isValid);
        } catch (Exception e) {
            LOGGER.error("Error verifying VNPay payment", e);
            return ResponseEntity.ok(false);
        }
    }
    
    @GetMapping("/test-payment/{billId}")
    public ResponseEntity<String> testCreatePaymentUrl(@PathVariable Integer billId, HttpServletRequest request) {
        try {
            String paymentUrl = vnpayService.createPaymentUrl(
                billId, 
                new java.math.BigDecimal("100000"), 
                "Test payment",
                request
            );
            return ResponseEntity.ok(paymentUrl);
        } catch (Exception e) {
            LOGGER.error("Error creating test payment URL", e);
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
