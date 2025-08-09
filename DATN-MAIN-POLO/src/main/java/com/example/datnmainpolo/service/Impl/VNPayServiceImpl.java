package com.example.datnmainpolo.service.Impl;

import com.example.datnmainpolo.config.VNPAYConfig;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.CartDetail;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.enums.FulfillmentStatus;
import com.example.datnmainpolo.enums.BillType;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.CartRepository;
import com.example.datnmainpolo.repository.CartDetailRepository;
import com.example.datnmainpolo.repository.BillDetailRepository;
import com.example.datnmainpolo.repository.TransactionRepository;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import com.example.datnmainpolo.repository.OrderHistoryRepository;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.CartAndCheckoutService;
import com.example.datnmainpolo.service.VNPayService;
import com.example.datnmainpolo.service.Impl.Email.EmailService;
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
    private final BillDetailRepository billDetailRepository;
    private final TransactionRepository transactionRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final CartAndCheckoutService cartAndCheckoutService;
    private final EmailService emailService;
    private final ProductDetailRepository productDetailRepository;

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
            String paymentUrl = VNPayUtil.createPaymentUrl(vnpayConfig.getPayUrl(), vnpayConfig.getHashSecret(),
                    vnpParams);
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

                // Convert VNPay amount back to normal format
                BigDecimal paidAmount = new BigDecimal(amount).divide(new BigDecimal(100));
                LOGGER.info("💰 VNPay payment amount: {} (converted from VNPay format: {})", paidAmount, amount);

                // Cập nhật thông tin thanh toán cho bill
                bill.setCustomerPayment(paidAmount);
                bill.setType(PaymentType.VNPAY);
                bill.setStatus(OrderStatus.PAID);
                // new axes
                bill.setPaymentStatus(PaymentStatus.PAID);
                if (bill.getFulfillmentStatus() == null || bill.getFulfillmentStatus() == FulfillmentStatus.PENDING) {
                    bill.setFulfillmentStatus(FulfillmentStatus.CONFIRMING);
                }
                bill.setUpdatedAt(java.time.Instant.now());
                bill.setUpdatedBy("VNPAY_SYSTEM");

                // Lưu bill với thông tin thanh toán đã cập nhật
                Bill savedBill = billRepository.save(bill);
                LOGGER.info("✅ Updated bill {} with VNPay payment: customerPayment={}, status={}",
                        billId, paidAmount, OrderStatus.PAID);

                // Cập nhật trạng thái tất cả BillDetail thành PAID
                try {
                    List<com.example.datnmainpolo.entity.BillDetail> billDetails = billDetailRepository
                            .findByBillId(billId);

                    for (com.example.datnmainpolo.entity.BillDetail detail : billDetails) {
                        detail.setStatus(com.example.datnmainpolo.enums.BillDetailStatus.PAID);
                        // typeOrder removed from BillDetail
                        detail.setUpdatedAt(java.time.Instant.now());
                        detail.setUpdatedBy("VNPAY_SYSTEM");
                    }

                    billDetailRepository.saveAll(billDetails);
                    LOGGER.info("✅ Updated {} bill details to PAID status for bill {}",
                            billDetails.size(), billId);

                    // ⭐ Deduct inventory NOW (payment succeeded) only for ONLINE orders.
                    if (savedBill.getBillType() == BillType.ONLINE) {
                        for (com.example.datnmainpolo.entity.BillDetail detail : billDetails) {
                            com.example.datnmainpolo.entity.ProductDetail pd = detail.getDetailProduct();
                            if (pd != null) {
                                int available = pd.getQuantity();
                                int need = detail.getQuantity();
                                if (available < need) {
                                    throw new RuntimeException("Sản phẩm " + pd.getCode() + " không đủ số lượng trong kho (còn " + available + ", cần " + need + ")");
                                }
                                pd.setQuantity(available - need);
                                if (pd.getQuantity() <= 0) {
                                    pd.setStatus(com.example.datnmainpolo.enums.ProductStatus.OUT_OF_STOCK);
                                }
                                productDetailRepository.save(pd);
                            }
                        }
                        LOGGER.info("✅ Deducted inventory after VNPay success for ONLINE bill {}", billId);
                    } else {
                        LOGGER.info("ℹ️ Skipping inventory deduction for non-ONLINE bill {} after VNPay success", billId);
                    }
                } catch (Exception e) {
                    LOGGER.error("❌ Failed to update bill details for bill {}", billId, e);
                    // Don't throw exception - payment was successful
                }

                // Cập nhật transaction status
                try {
                    Optional<com.example.datnmainpolo.entity.Transaction> transactionOpt = transactionRepository
                            .findByBillId(billId);

                    if (transactionOpt.isPresent()) {
                        com.example.datnmainpolo.entity.Transaction transaction = transactionOpt.get();
                        transaction.setStatus(com.example.datnmainpolo.enums.TransactionStatus.SUCCESS);
                        transaction.setTotalMoney(paidAmount);
                        transaction.setNote("Thanh toán VNPay thành công");
                        transaction.setUpdatedAt(java.time.Instant.now());
                        transactionRepository.save(transaction);
                        LOGGER.info("✅ Updated transaction for bill {} to SUCCESS", billId);
                    }
                } catch (Exception e) {
                    LOGGER.error("❌ Failed to update transaction for bill {}", billId, e);
                }

                // Tạo OrderHistory entry
                try {
                    com.example.datnmainpolo.entity.OrderHistory orderHistory = new com.example.datnmainpolo.entity.OrderHistory();
                    orderHistory.setBill(savedBill);
                    orderHistory.setStatusOrder(OrderStatus.PAID);
                    orderHistory.setActionDescription("Thanh toán VNPay thành công - Số tiền: " + paidAmount + " VND");
                    orderHistory.setCreatedAt(java.time.Instant.now());
                    orderHistory.setUpdatedAt(java.time.Instant.now());
                    orderHistory.setCreatedBy("VNPAY_SYSTEM");
                    orderHistory.setUpdatedBy("VNPAY_SYSTEM");
                    orderHistory.setDeleted(false);
                    orderHistoryRepository.save(orderHistory);
                    LOGGER.info("✅ Created order history entry for VNPay payment of bill {}", billId);
                } catch (Exception e) {
                    LOGGER.error("❌ Failed to create order history for bill {}", billId, e);
                }

                // Clear cart after successful payment
                try {
                    if (bill.getCustomer() != null) {
                        // Find cart using CartRepository
                        Optional<com.example.datnmainpolo.entity.Cart> cartOpt = cartRepository
                                .findByUserEntityId(bill.getCustomer().getId());

                        if (cartOpt.isPresent()) {
                            List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cartOpt.get().getId());
                            if (!cartDetails.isEmpty()) {
                                cartDetailRepository.deleteAll(cartDetails);
                                LOGGER.info("Cleared cart for user {} after successful VNPay payment",
                                        bill.getCustomer().getId());
                            }
                        }
                    }
                } catch (Exception e) {
                    LOGGER.warn("Failed to clear cart after successful payment for bill {}", billId, e);
                    // Don't throw exception here - payment was successful, cart clearing is not
                    // critical
                }

                // Send order confirmation email (prefer account email, fallback to guest email on Bill)
                try {
                    String to = null;
                    String userName = savedBill.getCustomerName();
                    if (savedBill.getCustomer() != null && savedBill.getCustomer().getEmail() != null) {
                        to = savedBill.getCustomer().getEmail();
                        if (savedBill.getCustomer().getName() != null) userName = savedBill.getCustomer().getName();
                    } else if (savedBill.getCustomerEmail() != null && !savedBill.getCustomerEmail().isEmpty()) {
                        to = savedBill.getCustomerEmail();
                    }
                    if (to != null) {
                        String billCode = savedBill.getCode();
                        BigDecimal finalAmount = savedBill.getFinalAmount();
                        String address = savedBill.getAddress();
                        String phone = savedBill.getPhoneNumber();
                        String paymentMethod = savedBill.getType() != null ? savedBill.getType().name() : "VNPAY";
                        emailService.sendOrderConfirmationEmail(to, userName, billCode, finalAmount, address, phone, paymentMethod);
                        LOGGER.info("📧 Sent order confirmation email to {} for bill {}", to, billId);
                    } else {
                        LOGGER.warn("Skipping order confirmation email: no email for bill {}", billId);
                    }
                } catch (Exception emailEx) {
                    LOGGER.error("Failed to send order confirmation email for bill {}: {}", billId, emailEx.getMessage());
                }

                // Return payment response
                return PaymentResponseDTO.builder()
                        .bill(billService.convertToBillResponseDTO(savedBill))
                        .paymentType(PaymentType.VNPAY)
                        .amount(paidAmount) // Use the converted amount
                        .build();
            } else {
                // Payment failed - do NOT clear cart, keep it for retry
                System.out.println("❌ VNPay payment FAILED - cart will NOT be cleared");
                System.out.println("Response code: " + responseCode);
                LOGGER.warn("VNPay payment failed for bill {} with response code {}", billId, responseCode);

                     
                // ROLLBACK VOUCHER TRƯỚC KHI HỦY ĐƠN HÀNG
                if (bill.getVoucherCode() != null) {
                    try {
                        System.out.println("🔄 Rolling back voucher for failed payment - Bill ID: " + billId + ", Voucher: " + bill.getVoucherCode());
                        cartAndCheckoutService.rollbackVoucher(billId);
                        System.out.println("✅ Successfully rolled back voucher " + bill.getVoucherCode() + " for failed VNPay payment");
                        LOGGER.info("Successfully rolled back voucher {} for failed VNPay payment of bill {}", bill.getVoucherCode(), billId);
                    } catch (Exception voucherRollbackException) {
                        System.out.println("❌ FAILED to rollback voucher for bill " + billId + ": " + voucherRollbackException.getMessage());
                        LOGGER.error("Failed to rollback voucher for failed VNPay payment of bill {}: {}", billId, voucherRollbackException.getMessage());
                        // Log chi tiết lỗi nhưng không throw exception để không làm gián đoạn quá trình xử lý
                        voucherRollbackException.printStackTrace();
                    }
                } else {
                    System.out.println("ℹ️ No voucher to rollback for bill " + billId);
                    LOGGER.info("No voucher to rollback for failed VNPay payment of bill {}", billId);
                }

                // Update bill status to CANCELLED
                try {
                    System.out.println("🔄 Attempting to update bill " + billId + " status to CANCELLED");
                    billService.updateBillStatus(billId, OrderStatus.CANCELLED);
                    System.out.println("✅ Successfully updated bill " + billId + " status to CANCELLED");
                    LOGGER.info("Updated bill {} status to CANCELLED due to failed VNPay payment", billId);
                } catch (Exception statusUpdateException) {
                    System.out.println(
                            "❌ FAILED to update bill " + billId + " status: " + statusUpdateException.getMessage());
                    LOGGER.error("Failed to update bill {} status to CANCELLED", billId, statusUpdateException);
                    statusUpdateException.printStackTrace();
                }

                // reflect payment failure axis
                bill.setPaymentStatus(PaymentStatus.FAILED);
                bill.setUpdatedAt(java.time.Instant.now());
                bill.setUpdatedBy("VNPAY_SYSTEM");
                billRepository.save(bill);

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
                        hashData.append(
                                java.net.URLEncoder.encode(fieldValue, java.nio.charset.StandardCharsets.US_ASCII));
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
