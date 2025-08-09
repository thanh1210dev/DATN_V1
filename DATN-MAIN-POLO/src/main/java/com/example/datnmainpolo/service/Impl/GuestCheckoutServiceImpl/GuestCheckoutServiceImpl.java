package com.example.datnmainpolo.service.Impl.GuestCheckoutServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.Checkout.GuestOrderRequestDTO;
import com.example.datnmainpolo.entity.*;
import com.example.datnmainpolo.enums.*;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.GuestCheckoutService;
import com.example.datnmainpolo.service.CartAndCheckoutService;
import com.example.datnmainpolo.service.Impl.Email.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import jakarta.mail.MessagingException;

@Service
@RequiredArgsConstructor
public class GuestCheckoutServiceImpl implements GuestCheckoutService {
    private static final Logger LOGGER = LoggerFactory.getLogger(GuestCheckoutServiceImpl.class);

    private final BillRepository billRepository;
    private final BillDetailRepository billDetailRepository;
    private final ProductDetailRepository productDetailRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final BillService billService;
    private final CartAndCheckoutService cartAndCheckoutService;
    private final EmailService emailService;

    @Transactional
    @Override
    public BillResponseDTO createOrder(GuestOrderRequestDTO request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Không có sản phẩm để tạo đơn hàng");
        }
    // Không tạo tài khoản cho khách vãng lai; chỉ lưu thông tin lên hóa đơn

        // Tạo Bill
        Bill bill = new Bill();
        bill.setCode("GUEST_" + System.currentTimeMillis());
        bill.setType(request.getPaymentType() != null ? request.getPaymentType() : PaymentType.COD);
        bill.setStatus(request.getPaymentType() == PaymentType.COD ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
        bill.setPaymentStatus(request.getPaymentType() == PaymentType.COD ? PaymentStatus.UNPAID : PaymentStatus.PENDING);
        bill.setFulfillmentStatus(request.getPaymentType() == PaymentType.COD ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
        bill.setBillType(BillType.ONLINE);
        bill.setCustomerName(request.getName());
        bill.setPhoneNumber(request.getPhoneNumber());
        bill.setAddress(composeAddress(request));
        // Lưu email khách trên Bill nếu có (cần đảm bảo Bill có field email hoặc dùng voucherCode/notes tuỳ thiết kế)
        // Lưu email khách (nếu có) lên Bill
        String email = request.getEmail();
        if (email != null && !email.trim().isEmpty()) {
            bill.setCustomerEmail(email.trim());
        }
        bill.setCreatedAt(Instant.now());
        bill.setUpdatedAt(Instant.now());
        bill.setCreatedBy("guest");
        bill.setUpdatedBy("guest");
        bill.setDeleted(false);
    bill.setTotalMoney(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    bill.setMoneyShip(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        bill.setReductionAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        bill.setFinalAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        bill.setCustomerPayment(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        bill = billRepository.save(bill);

        // Thêm BillDetail từ request items
        for (GuestOrderRequestDTO.Item it : request.getItems()) {
            ProductDetail pd = productDetailRepository.findById(it.getProductDetailId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
            if (pd.getQuantity() < it.getQuantity()) {
                throw new RuntimeException("Số lượng không đủ cho sản phẩm " + pd.getCode());
            }
            BillDetail bd = new BillDetail();
            bd.setBill(bill);
            bd.setDetailProduct(pd);
            bd.setQuantity(it.getQuantity());
            bd.setPrice(pd.getPrice());
            bd.setPromotionalPrice(pd.getPromotionalPrice());
            bd.setStatus(BillDetailStatus.PENDING);
            // typeOrder removed from BillDetail
            bd.setCreatedAt(Instant.now());
            bd.setUpdatedAt(Instant.now());
            bd.setCreatedBy("guest");
            bd.setUpdatedBy("guest");
            bd.setDeleted(false);
            billDetailRepository.save(bd);

            BigDecimal unit = pd.getPromotionalPrice() != null ? pd.getPromotionalPrice() : pd.getPrice();
            bill.setTotalMoney(bill.getTotalMoney().add(unit.multiply(BigDecimal.valueOf(it.getQuantity()))));

            // Trừ kho: CHỈ áp dụng ngay cho đơn không phải COD (ví dụ VNPAY)
            if (bill.getType() != PaymentType.COD) {
                pd.setQuantity(pd.getQuantity() - it.getQuantity());
                if (pd.getQuantity() <= 0) pd.setStatus(ProductStatus.OUT_OF_STOCK);
                productDetailRepository.save(pd);
            }
        }

    // Tính phí vận chuyển dựa trên địa chỉ và khối lượng ước tính
    try {
        Integer totalWeight = request.getItems().stream()
            .mapToInt(it -> 500 * (it.getQuantity() != null ? it.getQuantity() : 1))
            .sum();
        if (totalWeight == null || totalWeight <= 0) totalWeight = 500;
        BigDecimal shipFee = cartAndCheckoutService.calculateShippingFee(
            request.getDistrictId(),
            request.getWardCode(),
            totalWeight,
            30,
            20,
            10
        );
        bill.setMoneyShip(shipFee);
    } catch (Exception e) {
        LOGGER.error("Không thể tính phí ship cho đơn guest: {}", e.getMessage());
        // Giữ nguyên phí ship mặc định (0) nếu lỗi; FE đã tính hiển thị trước đó
    }

    // Tính finalAmount sau khi có ship
    bill.setFinalAmount(bill.getTotalMoney().subtract(bill.getReductionAmount()).add(bill.getMoneyShip()));
        bill = billRepository.save(bill);

        // Lịch sử đơn
        OrderHistory oh = new OrderHistory();
        oh.setBill(bill);
        oh.setStatusOrder(bill.getStatus());
        oh.setActionDescription("Tạo đơn hàng khách vãng lai");
        oh.setCreatedAt(Instant.now());
        oh.setUpdatedAt(Instant.now());
        oh.setCreatedBy("guest");
        oh.setUpdatedBy("guest");
        oh.setDeleted(false);
        orderHistoryRepository.save(oh);

        // Giao dịch
        Transaction tran = new Transaction();
        tran.setBill(bill);
        tran.setType(bill.getType() == PaymentType.COD ? TransactionType.PAYMENT : TransactionType.ONLINE);
        tran.setTotalMoney(bill.getFinalAmount());
        tran.setStatus(bill.getType() == PaymentType.COD ? TransactionStatus.PENDING : TransactionStatus.PENDING);
        tran.setNote("Khởi tạo giao dịch (guest)");
        tran.setCreatedAt(Instant.now());
        tran.setUpdatedAt(Instant.now());
        tran.setDeleted(false);
        transactionRepository.save(tran);

        // Gửi email xác nhận ngay cho đơn COD của khách vãng lai (nếu có email)
        if (bill.getType() == PaymentType.COD) {
            String to = bill.getCustomerEmail();
            if (to != null && !to.isBlank()) {
                try {
                    String userName = bill.getCustomerName() != null ? bill.getCustomerName() : "Bạn";
                    String billCode = bill.getCode();
                    BigDecimal finalAmount = bill.getFinalAmount();
                    String address = bill.getAddress();
                    String phone = bill.getPhoneNumber();
                    emailService.sendOrderConfirmationEmail(to, userName, billCode, finalAmount, address, phone, "COD");
                } catch (MessagingException e) {
                    LOGGER.error("Gửi email xác nhận đơn COD thất bại cho bill {}: {}", bill.getCode(), e.getMessage());
                } catch (Exception e) {
                    LOGGER.error("Lỗi không xác định khi gửi email đơn COD bill {}: {}", bill.getCode(), e.getMessage());
                }
            }
        }

        return billService.convertToBillResponseDTO2(bill);
    }

    private String composeAddress(GuestOrderRequestDTO req) {
        String base = req.getAddress() != null ? req.getAddress() : "";
        String ward = req.getWardName() != null ? req.getWardName() : "";
        String district = req.getDistrictName() != null ? req.getDistrictName() : "";
        String province = req.getProvinceName() != null ? req.getProvinceName() : "";
        String full = String.format("%s, %s, %s, %s", base, ward, district, province);
        return full.replaceAll(",\\s*,", ", ").replaceAll("^,\\s*|\\s*,\\s*$", "");
    }
}
