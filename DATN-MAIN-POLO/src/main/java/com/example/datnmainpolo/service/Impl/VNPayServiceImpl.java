package com.example.datnmainpolo.service.Impl;

import com.example.datnmainpolo.config.VNPAYConfig;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.CartDetail;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.CartRepository;
import com.example.datnmainpolo.repository.CartDetailRepository;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.VNPayService;
import com.example.datnmainpolo.utils.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayServiceImpl implements VNPayService {
    private static final Logger LOGGER = LoggerFactory.getLogger(VNPayServiceImpl.class);

    private final VNPAYConfig vnpayConfig;
    private final BillRepository billRepository;
    private final BillService billService;
    private final CartDetailRepository cartDetailRepository;
    private final CartRepository cartRepository;

    @Override
    public String createPaymentUrl(Integer billId, BigDecimal amount, String orderInfo, HttpServletRequest request) {
        LOGGER.info("Creating VNPay payment URL for bill {} with amount {}", billId, amount);
        
        try {
            // Validate bill exists
            billRepository.findById(billId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

            // Create payment parameters
            Map<String, String> vnpParams = new HashMap<>();
            vnpParams.put("vnp_Version", "2.1.0");
            vnpParams.put("vnp_Command", "pay");
            vnpParams.put("vnp_TmnCode", vnpayConfig.getTmnCode());
            // Đảm bảo vnp_Amount là số nguyên (VNPay yêu cầu: amount * 100)
            long amountLong = amount.multiply(new BigDecimal(100)).longValue();
            vnpParams.put("vnp_Amount", String.valueOf(amountLong));
            System.out.println("Original amount: " + amount);
            System.out.println("VNPay amount (x100): " + amountLong);
            vnpParams.put("vnp_CurrCode", "VND");
            vnpParams.put("vnp_TxnRef", billId.toString());
            // Loại bỏ dấu tiếng Việt và ký tự đặc biệt từ orderInfo
            String sanitizedOrderInfo = VNPayUtil.removeDiacritics(orderInfo)
                    .replaceAll("[^a-zA-Z0-9\\s]", "_"); // Thay thế ký tự đặc biệt bằng dấu gạch dưới
            vnpParams.put("vnp_OrderInfo", sanitizedOrderInfo);
            
            // Log để debug
            System.out.println("Original orderInfo: " + orderInfo);
            System.out.println("Sanitized orderInfo: " + sanitizedOrderInfo);
            
            vnpParams.put("vnp_OrderType", "other");
            vnpParams.put("vnp_Locale", "vn");
            vnpParams.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
            
            // Sử dụng IP cố định theo code mẫu GitHub
            String clientIp = "127.0.0.1";
            vnpParams.put("vnp_IpAddr", clientIp);
            System.out.println("Using IP: " + clientIp);


            // Create date với timezone theo code mẫu GitHub
            Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnpCreateDate = formatter.format(calendar.getTime());
            vnpParams.put("vnp_CreateDate", vnpCreateDate);
            
            // Expire time (15 phút)
            calendar.add(Calendar.MINUTE, 15);
            String vnpExpireDate = formatter.format(calendar.getTime());
            vnpParams.put("vnp_ExpireDate", vnpExpireDate);

            // Create payment URL
            String paymentUrl = VNPayUtil.createPaymentUrl(vnpayConfig.getPayUrl(), vnpayConfig.getHashSecret(), vnpParams);
            LOGGER.info("VNPay payment URL created successfully for bill {}: {}", billId, paymentUrl);
            
            return paymentUrl;
        } catch (Exception e) {
            LOGGER.error("Error creating VNPay payment URL for bill {}", billId, e);
            throw new RuntimeException("Lỗi tạo URL thanh toán VNPay: " + e.getMessage());
        }
    }

    @Override
    public PaymentResponseDTO processVNPayCallback(Map<String, String> params) {
        System.out.println("=== VNPAY CALLBACK DEBUG START ===");
        System.out.println("Callback params: " + params);
        
        LOGGER.info("Processing VNPay callback with params: {}", params);
        
        try {
            // Verify payment
            if (!verifyPayment(params)) {
                throw new RuntimeException("Chữ ký VNPay không hợp lệ");
            }

            String responseCode = params.get("vnp_ResponseCode");
            String txnRef = params.get("vnp_TxnRef");
            String amount = params.get("vnp_Amount");
            
            Integer billId = Integer.parseInt(txnRef);
            Bill bill = billRepository.findById(billId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

            if ("00".equals(responseCode)) {
                // Payment successful
                System.out.println("✅ VNPay payment SUCCESS - will clear cart");
                LOGGER.info("VNPay payment successful for bill {}", billId);
                
                // Update bill status to PAID
                billService.updateBillStatus(billId, OrderStatus.PAID);
                
                // Clear cart after successful payment
                try {
                    if (bill.getCustomer() != null) {
                        // Find cart using CartRepository
                        Optional<com.example.datnmainpolo.entity.Cart> cartOpt = 
                            cartRepository.findByUserEntityId(bill.getCustomer().getId());
                        
                        if (cartOpt.isPresent()) {
                            List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cartOpt.get().getId());
                            if (!cartDetails.isEmpty()) {
                                cartDetailRepository.deleteAll(cartDetails);
                                LOGGER.info("Cleared cart for user {} after successful VNPay payment", bill.getCustomer().getId());
                            }
                        }
                    }
                } catch (Exception e) {
                    LOGGER.warn("Failed to clear cart after successful payment for bill {}", billId, e);
                    // Don't throw exception here - payment was successful, cart clearing is not critical
                }
                
                // Return payment response
                return PaymentResponseDTO.builder()
                        .bill(billService.convertToBillResponseDTO(bill))
                        .paymentType(PaymentType.VNPAY)
                        .amount(new BigDecimal(amount).divide(new BigDecimal(100))) // Convert back from VNPay format
                        .build();
            } else {
                // Payment failed - do NOT clear cart, keep it for retry
                System.out.println("❌ VNPay payment FAILED - cart will NOT be cleared");
                System.out.println("Response code: " + responseCode);
                LOGGER.warn("VNPay payment failed for bill {} with response code {}", billId, responseCode);
                
                // Update bill status to CANCELLED
                try {
                    System.out.println("🔄 Attempting to update bill " + billId + " status to CANCELLED");
                    billService.updateBillStatus(billId, OrderStatus.CANCELLED);
                    System.out.println("✅ Successfully updated bill " + billId + " status to CANCELLED");
                    LOGGER.info("Updated bill {} status to CANCELLED due to failed VNPay payment", billId);
                } catch (Exception statusUpdateException) {
                    System.out.println("❌ FAILED to update bill " + billId + " status: " + statusUpdateException.getMessage());
                    LOGGER.error("Failed to update bill {} status to CANCELLED", billId, statusUpdateException);
                    statusUpdateException.printStackTrace();
                }
                
                throw new RuntimeException("Thanh toán VNPay thất bại. Mã lỗi: " + responseCode);
            }
        } catch (Exception e) {
            LOGGER.error("Error processing VNPay callback", e);
            throw new RuntimeException("Lỗi xử lý callback VNPay: " + e.getMessage());
        }
    }

    @Override
    public boolean verifyPayment(Map<String, String> params) {
        try {
            String vnpSecureHash = params.get("vnp_SecureHash");
            
            // Remove signature fields from params before verification
            Map<String, String> paramsForHash = new HashMap<>(params);
            paramsForHash.remove("vnp_SecureHashType");
            paramsForHash.remove("vnp_SecureHash");
            
            // Create signature data theo code mẫu GitHub
            List<String> fieldNames = new ArrayList<>(paramsForHash.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = paramsForHash.get(fieldName);
                if (fieldValue != null && fieldValue.length() > 0) {
                    try {
                        // Encode giống như khi tạo URL
                        hashData.append(fieldName);
                        hashData.append('=');
                        hashData.append(java.net.URLEncoder.encode(fieldValue, java.nio.charset.StandardCharsets.US_ASCII));
                        if (itr.hasNext()) {
                            hashData.append('&');
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
            
            System.out.println("Verify hashData: " + hashData.toString());
            String signValue = VNPayUtil.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            System.out.println("Verify signature: " + signValue);
            System.out.println("VNPay signature: " + vnpSecureHash);
            
            return signValue.equals(vnpSecureHash);
        } catch (Exception e) {
            LOGGER.error("Error verifying VNPay payment signature", e);
            return false;
        }
    }
}
