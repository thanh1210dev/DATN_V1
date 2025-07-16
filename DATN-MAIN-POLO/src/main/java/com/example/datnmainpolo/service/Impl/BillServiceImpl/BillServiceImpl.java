package com.example.datnmainpolo.service.Impl.BillServiceImpl;

import com.example.datnmainpolo.config.VNPAYConfig;
import com.example.datnmainpolo.dto.BillDTO.*;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.PaymentWebhookRequestDto;
import com.example.datnmainpolo.dto.BillDetailDTO.VNPayPaymentRequestDto;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.*;
import com.example.datnmainpolo.enums.*;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.Impl.BillDetailServiceImpl.InvoicePDFService;
import com.example.datnmainpolo.utils.VNPayUtil;
import com.example.datnmainpolo.service.OrderHistoryService;
import com.example.datnmainpolo.service.UserService;
import com.example.datnmainpolo.service.BillService;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {
        private static final Logger LOGGER = LoggerFactory.getLogger(BillServiceImpl.class);
        private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        private final BillRepository billRepository;
        private final UserRepository userRepository;
        private final CustomerInformationRepository customerInformationRepository;
        private final BillDetailRepository billDetailRepository;
        private final VoucherRepository voucherRepository;
        private final OrderHistoryService orderHistoryService;
        private final TransactionRepository transactionRepository;
        private final ProductDetailRepository productDetailRepository;
        private final OrderHistoryRepository orderHistoryRepository;
        private final InvoicePDFService invoicePDFService;
        private final BillDetailService billDetailService;
        private final UserService userService;
        private final VNPAYConfig vnpayConfig;

        @Override
        @Transactional
        public BillResponseDTO counterSale() {
                LOGGER.info("Creating new counter sale bill");
                long pendingBillsCount = billRepository.countByStatusAndDeletedFalse(OrderStatus.PENDING);
                if (pendingBillsCount >= 5) {
                        throw new RuntimeException("Đã đạt tối đa 5 hóa đơn đang chờ xử lý");
                }

                UserEntity employee = userRepository.findById(1)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng"));

                Bill bill = new Bill();
                bill.setCode("BILL" + System.currentTimeMillis());
                bill.setStatus(OrderStatus.PENDING);
                bill.setBillType(BillType.OFFLINE);
                bill.setCreatedAt(Instant.now());
                bill.setUpdatedAt(Instant.now());
                bill.setCreatedBy(employee.getName());
                bill.setUpdatedBy(employee.getName());
                bill.setDeleted(false);
                bill.setEmployee(employee);
                bill.setTotalMoney(ZERO);
                bill.setMoneyShip(ZERO);
                bill.setReductionAmount(ZERO);
                bill.setFinalAmount(ZERO);

                Bill savedBill = billRepository.save(bill);

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(OrderStatus.PENDING);
                orderHistory.setActionDescription("Tạo hóa đơn mới tại quầy");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(employee.getName());
                orderHistory.setUpdatedBy(employee.getName());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                Transaction transaction = new Transaction();
                transaction.setBill(savedBill);
                transaction.setType(TransactionType.PAYMENT);
                transaction.setTotalMoney(ZERO);
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Khởi tạo giao dịch");
                transaction.setCreatedAt(Instant.now());
                transaction.setUpdatedAt(Instant.now());
                transaction.setDeleted(false);
                transactionRepository.save(transaction);

                applyBestPublicVoucher(savedBill);

                return convertToBillResponseDTO(savedBill);
        }

        @Override
        public PaginationResponse<BillResponseDTO> searchBills(String code, OrderStatus status, int page, int size) {
                LOGGER.debug("Searching bills with code: {}, status: {}, page: {}, size: {}", code, status, page, size);
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
                Page<Bill> pageData = billRepository.findByCodeOrStatus(code, status, pageable);
                Page<BillResponseDTO> dtoPage = pageData.map(this::convertToBillResponseDTO);
                return new PaginationResponse<>(dtoPage);
        }

        @Override
        public PaginationResponse<BillResponseDTO> searchBillsAdvanced(String code, OrderStatus status,
                        Instant startDate, Instant endDate, BigDecimal minPrice, BigDecimal maxPrice, int page,
                        int size) {
                LOGGER.debug("Advanced search bills with code: {}, status: {}, startDate: {}, endDate: {}, minPrice: {}, maxPrice: {}, page: {}, size: {}",
                                code, status, startDate, endDate, minPrice, maxPrice, page, size);
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
                Page<Bill> pageData = billRepository.findByAdvancedCriteria(
                                code != null && !code.trim().isEmpty() ? code : null,
                                status,
                                startDate,
                                endDate,
                                minPrice != null ? minPrice : BigDecimal.ZERO,
                                maxPrice != null ? maxPrice : new BigDecimal("999999999999999.99"),
                                pageable);
                Page<BillResponseDTO> dtoPage = pageData.map(this::convertToBillResponseDTO);
                return new PaginationResponse<>(dtoPage);
        }

        @Override
        @Transactional
        public BillResponseDTO addVoucherToBill(Integer billId, String voucherCode) {
                LOGGER.info("Applying voucher {} to bill {}", voucherCode, billId);
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                if (bill.getVoucherCode() != null) {
                        bill.setVoucherCode(null);
                        bill.setVoucherName(null);
                        bill.setReductionAmount(ZERO);
                        bill.setFinalAmount(calculateFinalAmount(bill));
                }

                Voucher appliedVoucher = null;
                if (voucherCode == null || voucherCode.trim().isEmpty()) {
                        applyBestPublicVoucher(bill);
                } else {
                        try {
                                appliedVoucher = voucherRepository.findByCodeAndDeletedFalse(voucherCode)
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Không tìm thấy voucher hoặc voucher không hợp lệ"));
                                validateVoucher(appliedVoucher, bill);
                                applyVoucher(bill, appliedVoucher);
                        } catch (IncorrectResultSizeDataAccessException e) {
                                LOGGER.error("Multiple vouchers found for code: {}", voucherCode, e);
                                throw new RuntimeException("Mã voucher không duy nhất. Vui lòng kiểm tra dữ liệu.");
                        }
                }

                Bill savedBill = billRepository.save(bill);

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(bill.getStatus());
                orderHistory.setActionDescription(
                                voucherCode != null ? "Áp dụng voucher " + voucherCode : "Áp dụng voucher tự động");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                BillResponseDTO response = convertToBillResponseDTO(savedBill);
                if (appliedVoucher != null) {
                        response.setVoucherDiscountAmount(bill.getReductionAmount());
                        response.setVoucherType(appliedVoucher.getType());
                }
                return response;
        }

        @Override
        @Transactional
        public BillResponseDTO updateBillStatus(Integer billId, OrderStatus newStatus) {
                LOGGER.info("Updating bill {} status to {}", billId, newStatus);
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                OrderStatus currentStatus = bill.getStatus();

                if (newStatus == OrderStatus.CANCELLED) {
                        List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
                        for (BillDetail detail : billDetails) {
                                ProductDetail productDetail = detail.getDetailProduct();
                                productDetail.setQuantity(productDetail.getQuantity() + detail.getQuantity());
                                if (productDetail.getQuantity() > 0) {
                                        productDetail.setStatus(ProductStatus.AVAILABLE);
                                }
                                productDetailRepository.save(productDetail);
                        }

                        if (bill.getVoucherCode() != null) {
                                bill.setVoucherCode(null);
                                bill.setVoucherName(null);
                                bill.setReductionAmount(ZERO);
                                bill.setFinalAmount(calculateFinalAmount(bill));
                        }
                }

                bill.setStatus(newStatus);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(newStatus);
                orderHistory.setActionDescription("Cập nhật trạng thái từ " + currentStatus + " sang " + newStatus);
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                Transaction transaction = transactionRepository.findByBillId(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

                switch (newStatus) {
                        case PAID:
                                transaction.setStatus(TransactionStatus.SUCCESS);
                                transaction.setNote("Thanh toán thành công");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case CANCELLED:
                                transaction.setStatus(TransactionStatus.CANCELLED);
                                transaction.setNote("Hủy đơn hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case REFUNDED:
                                transaction.setStatus(TransactionStatus.REFUNDED);
                                transaction.setNote("Hoàn tiền cho khách hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case COMPLETED:
                                if (transaction.getStatus() != TransactionStatus.SUCCESS) {
                                        throw new RuntimeException("Không thể hoàn thành đơn hàng chưa thanh toán");
                                }
                                break;
                        case RETURNED:
                        case RETURN_COMPLETED:
                                if (transaction.getStatus() != TransactionStatus.SUCCESS) {
                                        throw new RuntimeException("Không thể trả hàng cho đơn hàng chưa thanh toán");
                                }
                                break;
                }

                Bill savedBill = billRepository.save(bill);
                return convertToBillResponseDTO(savedBill);
        }

        @Override
        @Transactional
        public PaymentResponseDTO processPayment(Integer billId, PaymentType paymentType, BigDecimal amount) {
                LOGGER.info("Processing payment for bill {} with type {}", billId, paymentType);
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                if (bill.getStatus() != OrderStatus.PENDING) {
                        throw new RuntimeException(
                                        "Không thể thanh toán cho đơn hàng không ở trạng thái chờ thanh toán");
                }

                BigDecimal finalAmount = calculateFinalAmount(bill);
                if (finalAmount == null) {
                        LOGGER.error("Final amount is null for bill {}", billId);
                        throw new RuntimeException("Không thể tính toán số tiền cuối cùng");
                }

                boolean isOfflineWithCustomer = bill.getBillType() == BillType.OFFLINE
                                && bill.getCustomerInfor() != null;
                if (isOfflineWithCustomer) {
                        LOGGER.info("Bill {} is OFFLINE with customerInfor, setting billType to ONLINE and typeOrder to CONFIRMING",
                                        billId);
                        bill.setBillType(BillType.ONLINE);
                        bill.setUpdatedAt(Instant.now());
                        bill.setUpdatedBy("system");
                        billRepository.save(bill);

                        List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
                        for (BillDetail detail : billDetails) {
                                detail.setTypeOrder(OrderStatus.CONFIRMING);
                                detail.setUpdatedAt(Instant.now());
                                detail.setUpdatedBy("system");
                                billDetailRepository.save(detail);
                        }

                        OrderHistory orderHistory = new OrderHistory();
                        orderHistory.setBill(bill);
                        orderHistory.setStatusOrder(bill.getStatus());
                        orderHistory.setActionDescription(
                                        "Hóa đơn tại quầy có thông tin khách hàng, chuyển thành ONLINE, cập nhật typeOrder thành CONFIRMING");
                        orderHistory.setCreatedAt(Instant.now());
                        orderHistory.setUpdatedAt(Instant.now());
                        orderHistory.setCreatedBy("system");
                        orderHistory.setUpdatedBy("system");
                        orderHistory.setDeleted(false);
                        orderHistoryRepository.save(orderHistory);
                }

                PaymentResponseDTO response;
                switch (paymentType) {
                        case CASH:
                                response = processCashPayment(bill, finalAmount, amount, isOfflineWithCustomer);
                                break;
                        case BANKING:
                                response = processBankingPayment(bill, finalAmount, isOfflineWithCustomer);
                                break;
                        case VNPAY:
                                response = processVNPayPayment(bill, finalAmount, isOfflineWithCustomer);
                                break;
                        default:
                                throw new RuntimeException("Loại thanh toán không hợp lệ");
                }

                if (bill.getStatus() == OrderStatus.PAID && bill.getVoucherCode() != null) {
                        decrementVoucherQuantity(bill.getVoucherCode());
                }

                bill.setCompletionDate(Instant.now());
                billRepository.save(bill);
                BillResponseDTO billResponse = convertToBillResponseDTO(bill);
                List<BillDetailResponseDTO> billDetails = billDetailService.getAllBillDetailsByBillId(billId);
                String invoicePDF = invoicePDFService.generateInvoicePDF(billResponse, billDetails);
                response.setInvoicePDF(invoicePDF);

                return response;
        }

        private PaymentResponseDTO processCashPayment(Bill bill, BigDecimal finalAmount, BigDecimal amount,
                        boolean isOfflineWithCustomer) {
                LOGGER.info("Processing cash payment for bill {} with amount {}", bill.getId(), amount);
                if (amount == null) {
                        LOGGER.error("Amount is null for bill {}", bill.getId());
                        throw new IllegalArgumentException("Số tiền thanh toán không được null");
                }
                if (amount.compareTo(finalAmount) < 0) {
                        throw new RuntimeException("Số tiền thanh toán không đủ");
                }
                if (amount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }
                bill.setType(PaymentType.CASH);

                bill.setStatus(OrderStatus.PAID);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                //Kiểm tra Bill xem người dùng có chưa nếu có thì tính tích điểm        
                if(bill.getCustomer() != null && bill.getStatus() == OrderStatus.PAID){
                        BigDecimal orderValue = bill.getFinalAmount();
                        userService.updateLoyaltyPoints(bill.getCustomer().getId(), orderValue);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(isOfflineWithCustomer ? TransactionType.ONLINE : TransactionType.PAYMENT);
                transaction.setTotalMoney(amount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Thanh toán tiền mặt thành công"
                                + (isOfflineWithCustomer ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                                .bill(convertToBillResponseDTO(savedBill))
                                .paymentType(bill.getType()) // Sử dụng PaymentType của bill
                                .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                                .build();
        }

        private PaymentResponseDTO processBankingPayment(Bill bill, BigDecimal finalAmount,
                        boolean isOfflineWithCustomer) {
                LOGGER.info("Processing banking payment for bill {} with amount {}", bill.getId(), finalAmount);
                if (finalAmount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }

                bill.setStatus(OrderStatus.PENDING);
                bill.setType(PaymentType.BANKING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                transaction.setTotalMoney(finalAmount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán chuyển khoản"
                                + (isOfflineWithCustomer ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                                .bill(convertToBillResponseDTO(savedBill))
                                .paymentType(bill.getType()) // Sử dụng PaymentType của bill
                                .qrCode("/asset/maqr.jpg")
                                .bankAccount("013607122")
                                .bankName("ACB")
                                .accountName("Nguyễn Như Thành")
                                .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                                .build();
        }

        private PaymentResponseDTO processVNPayPayment(Bill bill, BigDecimal finalAmount,
                        boolean isOfflineWithCustomer) {
                LOGGER.info("Processing VNPay payment for bill {} with amount {}", bill.getId(), finalAmount);
                if (finalAmount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }

                bill.setStatus(OrderStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                transaction.setTotalMoney(finalAmount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán VNPay" + (isOfflineWithCustomer ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                                .bill(convertToBillResponseDTO(savedBill))
                                .paymentType(bill.getType()) // Sử dụng PaymentType của bill
                                .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                                .build();
        }

        @Override
        @Transactional
        public BillResponseDTO confirmBankingPayment(Integer billId) {
                LOGGER.info("Confirming banking payment for bill {}", billId);
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                if (bill.getStatus() != OrderStatus.PENDING || bill.getType() != PaymentType.BANKING) {
                        throw new RuntimeException("Không thể xác nhận thanh toán cho đơn hàng này");
                }

                bill.setStatus(OrderStatus.PAID);
                bill.setCompletionDate(Instant.now()); // Cập nhật completionDate khi xác nhận thanh toán
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");

                if (bill.getVoucherCode() != null) {
                        decrementVoucherQuantity(bill.getVoucherCode());
                }

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(OrderStatus.PAID);
                orderHistory.setActionDescription("Xác nhận thanh toán chuyển khoản thành công");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                Transaction transaction = transactionRepository.findByBillId(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Xác nhận thanh toán chuyển khoản thành công");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                Bill savedBill = billRepository.save(bill);
                if(bill.getCustomer() != null && bill.getStatus() == OrderStatus.PAID){
                        BigDecimal orderValue = bill.getFinalAmount();
                        userService.updateLoyaltyPoints(bill.getCustomer().getId(), orderValue);
                }
                BillResponseDTO billResponse = convertToBillResponseDTO(savedBill);

                List<BillDetailResponseDTO> billDetails = billDetailService.getAllBillDetailsByBillId(billId);
                String invoicePDF = invoicePDFService.generateInvoicePDF(billResponse, billDetails);

                PaymentResponseDTO response = PaymentResponseDTO.builder()
                                .bill(billResponse)
                                .paymentType(bill.getType())
                                .amount(bill.getFinalAmount().setScale(2, RoundingMode.HALF_UP))
                                .qrCode("/asset/maqr.jpg")
                                .bankAccount("013607122")
                                .bankName("ACB")
                                .accountName("Nguyễn Như Thành")
                                .invoicePDF(invoicePDF)
                                .build();

                return billResponse;
        }

        @Override
        @Transactional
        public String generateInvoice(Integer billId) {
                LOGGER.info("Generating invoice for bill {}", billId);
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                if (bill.getBillType() != BillType.OFFLINE || bill.getStatus() != OrderStatus.PAID) {
                        throw new RuntimeException("Chỉ có thể in hóa đơn cho đơn hàng OFFLINE và đã THANH TOÁN");
                }

                BillResponseDTO billResponse = convertToBillResponseDTO(bill);
                List<BillDetailResponseDTO> billDetails = billDetailService.getAllBillDetailsByBillId(billId);
                return invoicePDFService.generateInvoicePDF(billResponse, billDetails);
        }

        @Override
        public BillResponseDTO getDetail(Integer billId) {
                return billRepository.findById(billId).stream().map(this::convertToBillResponseDTO).findFirst()
                                .orElse(null);
        }

        void applyBestPublicVoucher(Bill bill) {
                LOGGER.debug("Applying best public voucher for bill {}", bill.getId());
                List<Voucher> publicVouchers = voucherRepository.findByTypeUserAndStatusAndDeletedFalse(
                                VoucherTypeUser.PUBLIC, PromotionStatus.ACTIVE);

                Voucher bestVoucher = null;
                BigDecimal maxReduction = ZERO;

                Instant now = Instant.now();
                for (Voucher voucher : publicVouchers) {
                        if (now.isAfter(voucher.getStartTime()) && now.isBefore(voucher.getEndTime()) &&
                                        voucher.getQuantity() > 0
                                        && bill.getTotalMoney().compareTo(voucher.getMinOrderValue()) >= 0) {

                                BigDecimal reduction = calculateReduction(bill.getTotalMoney(), voucher);
                                if (reduction != null && reduction.compareTo(maxReduction) > 0) {
                                        maxReduction = reduction;
                                        bestVoucher = voucher;
                                }
                        }
                }

                if (bestVoucher != null) {
                        applyVoucher(bill, bestVoucher);
                } else {
                        bill.setVoucherCode(null);
                        bill.setVoucherName(null);
                        bill.setReductionAmount(ZERO);
                        bill.setFinalAmount(calculateFinalAmount(bill));
                }
        }

        private void applyVoucher(Bill bill, Voucher voucher) {
                LOGGER.debug("Applying voucher {} to bill {}", voucher.getCode(), bill.getId());
                BigDecimal totalMoney = bill.getTotalMoney() != null ? bill.getTotalMoney() : ZERO;
                BigDecimal reductionAmount;
                if (voucher.getType() == VoucherType.PERCENTAGE) {
                        BigDecimal percentage = voucher.getPercentageDiscountValue() != null
                                        ? voucher.getPercentageDiscountValue()
                                        : ZERO;
                        reductionAmount = totalMoney.multiply(percentage)
                                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        if (voucher.getMaxDiscountValue() != null
                                        && reductionAmount.compareTo(voucher.getMaxDiscountValue()) > 0) {
                                reductionAmount = voucher.getMaxDiscountValue();
                        }
                } else {
                        reductionAmount = voucher.getFixedDiscountValue() != null ? voucher.getFixedDiscountValue()
                                        : ZERO;
                        if (reductionAmount.compareTo(totalMoney) > 0) {
                                reductionAmount = totalMoney;
                        }
                }

                bill.setVoucherCode(voucher.getCode());
                bill.setVoucherName(voucher.getName());
                bill.setReductionAmount(reductionAmount);
                bill.setFinalAmount(totalMoney.subtract(reductionAmount)
                                .add(bill.getMoneyShip() != null ? bill.getMoneyShip() : ZERO));
        }

        private void decrementVoucherQuantity(String voucherCode) {
                LOGGER.debug("Decrementing quantity for voucher {}", voucherCode);
                try {
                        Optional<Voucher> voucherOpt = voucherRepository.findByCodeAndDeletedFalse(voucherCode);
                        if (voucherOpt.isPresent()) {
                                Voucher voucher = voucherOpt.get();
                                voucher.setQuantity(voucher.getQuantity() - 1);
                                if (voucher.getQuantity() == 0) {
                                        voucher.setStatus(PromotionStatus.USED_UP);
                                }
                                voucherRepository.save(voucher);
                        } else {
                                LOGGER.warn("Voucher {} not found or already deleted", voucherCode);
                        }
                } catch (IncorrectResultSizeDataAccessException e) {
                        LOGGER.error("Multiple vouchers found for code: {}", voucherCode, e);
                        throw new RuntimeException("Mã voucher không duy nhất. Vui lòng kiểm tra dữ liệu.");
                }
        }

        private void validateVoucher(Voucher voucher, Bill bill) {
                LOGGER.debug("Validating voucher {} for bill {}", voucher.getCode(), bill.getId());
                Instant now = Instant.now();
                if (voucher.getTypeUser() != VoucherTypeUser.PUBLIC) {
                        throw new RuntimeException("Chỉ có thể sử dụng voucher PUBLIC");
                }
                if (now.isBefore(voucher.getStartTime())) {
                        throw new RuntimeException("Voucher chưa đến thời gian áp dụng");
                }
                if (now.isAfter(voucher.getEndTime())) {
                        throw new RuntimeException("Voucher đã hết hạn");
                }
                if (voucher.getStatus() != PromotionStatus.ACTIVE) {
                        throw new RuntimeException("Voucher không ở trạng thái ACTIVE");
                }
                if (voucher.getQuantity() <= 0) {
                        throw new RuntimeException("Voucher đã hết lượt sử dụng");
                }
                if (bill.getTotalMoney().compareTo(voucher.getMinOrderValue()) < 0) {
                        throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinOrderValue());
                }
        }

        private BigDecimal calculateReduction(BigDecimal totalMoney, Voucher voucher) {
                if (totalMoney == null) {
                        LOGGER.warn("Total money is null for voucher {}", voucher.getCode());
                        return ZERO;
                }
                if (voucher.getType() == VoucherType.PERCENTAGE) {
                        BigDecimal percentage = voucher.getPercentageDiscountValue() != null
                                        ? voucher.getPercentageDiscountValue()
                                        : ZERO;
                        BigDecimal reduction = totalMoney.multiply(percentage)
                                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        if (voucher.getMaxDiscountValue() != null
                                        && reduction.compareTo(voucher.getMaxDiscountValue()) > 0) {
                                return voucher.getMaxDiscountValue();
                        }
                        return reduction;
                } else {
                        BigDecimal fixed = voucher.getFixedDiscountValue() != null ? voucher.getFixedDiscountValue()
                                        : ZERO;
                        return fixed.min(totalMoney);
                }
        }

        private BigDecimal calculateFinalAmount(Bill bill) {
                BigDecimal totalMoney = bill.getTotalMoney() != null ? bill.getTotalMoney() : ZERO;
                BigDecimal reductionAmount = bill.getReductionAmount() != null ? bill.getReductionAmount() : ZERO;
                BigDecimal moneyShip = bill.getMoneyShip() != null ? bill.getMoneyShip() : ZERO;
                return totalMoney.subtract(reductionAmount).add(moneyShip);
        }

        BillResponseDTO convertToBillResponseDTO(Bill bill) {
                BigDecimal voucherDiscountAmount = bill.getReductionAmount();
                VoucherType voucherType = null;
                if (bill.getVoucherCode() != null) {
                        Optional<Voucher> voucherOpt = voucherRepository
                                        .findByCodeAndDeletedFalse(bill.getVoucherCode());
                        if (voucherOpt.isPresent()) {
                                voucherType = voucherOpt.get().getType();
                        }
                }

                return BillResponseDTO.builder()
                                .id(bill.getId())
                                .code(bill.getCode())
                                .status(bill.getStatus())
                                .customerName(bill.getCustomerName())
                                .phoneNumber(bill.getPhoneNumber())
                                .address(bill.getAddress())
                                .billType(bill.getBillType())
                                .totalMoney(bill.getTotalMoney())
                                .reductionAmount(bill.getReductionAmount())
                                .moneyShip(bill.getMoneyShip())
                                .finalAmount(bill.getFinalAmount())
                                .createdAt(bill.getCreatedAt())
                                .employeeName(bill.getEmployee() != null ? bill.getEmployee().getName() : null)
                                .type(bill.getType())
                                .createdBy(bill.getCreatedBy())
                                .createdAt(bill.getCreatedAt())
                                .updatedBy(bill.getUpdatedBy())
                                .voucherCode(bill.getVoucherCode())
                                .voucherName(bill.getVoucherName())
                                .voucherDiscountAmount(voucherDiscountAmount)
                                .voucherType(voucherType)
                                .build();
        }

        @Override
        public BillResponseDTO addLoyalCustomerToBill(Integer billId, Integer customerId) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        UserEntity customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));
        bill.setCustomer(customer);
        bill.setCustomerName(customer.getName());
        bill.setPhoneNumber(customer.getPhoneNumber());
        bill.setAddress(customer.getAddress());
        billRepository.save(bill);
        return convertToBillResponseDTO(bill);
        }

        @Override
        public BillResponseDTO addVisitingGuests(Integer billId , CustomerRequestDTO requestDTO) {
                Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
                bill.setCustomerName(requestDTO.getName());
                bill.setPhoneNumber(requestDTO.getPhoneNumber());
                bill.setAddress(requestDTO.getAddress());
                billRepository.save(bill);
        return convertToBillResponseDTO(bill);
        }

        @Override
        public void handlePaymentWebhook(PaymentWebhookRequestDto webhookRequest) {
            String billCode = webhookRequest.getOrderReference();
            Bill bill = billRepository.findByCode(billCode)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        
            String status = webhookRequest.getStatus();
            if ("SUCCESS".equalsIgnoreCase(status)) {
                bill.setStatus(OrderStatus.PAID);
                bill.setType(PaymentType.VNPAY);
                bill.setCompletionDate(Instant.now());
                billRepository.save(bill);
        
                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Thanh toán VNPay thành công (webhook)");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);
            } else {
                bill.setStatus(OrderStatus.PENDING);
                billRepository.save(bill);
        
                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.FAILED);
                transaction.setNote("Thanh toán VNPay thất bại (webhook)");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);
            }
        }
        
        

        @Override
        public String createVNPayPaymentUrl(VNPayPaymentRequestDto requestDto, HttpServletRequest request) {
            Bill bill = billRepository.findById(requestDto.getBillId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
            if (bill.getStatus() != OrderStatus.PENDING) {
                throw new RuntimeException("Hóa đơn không ở trạng thái chờ thanh toán");
            }
            BigDecimal totalAmount = bill.getFinalAmount();
            if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Tổng tiền không hợp lệ");
            }
            long amountInVND = totalAmount.longValue() * 100L; // VNPay yêu cầu nhân 100

            String vnp_TxnRef = bill.getCode() + "_" + System.currentTimeMillis();
            String vnp_OrderInfo = "Thanh toan hoa don " + bill.getCode();

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnpayConfig.getApiVersion());
            vnp_Params.put("vnp_Command", vnpayConfig.getCommand());
            vnp_Params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
            vnp_Params.put("vnp_Amount", String.valueOf(amountInVND));
            vnp_Params.put("vnp_CurrCode", vnpayConfig.getCurrCode());
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
            vnp_Params.put("vnp_OrderType", vnpayConfig.getOrderType());
            vnp_Params.put("vnp_Locale", vnpayConfig.getLocale());
            vnp_Params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
            vnp_Params.put("vnp_IpAddr", request.getRemoteAddr());
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            LocalDateTime now = LocalDateTime.now();
            vnp_Params.put("vnp_CreateDate", now.format(formatter));
            LocalDateTime expire = now.plusMinutes(15);
            vnp_Params.put("vnp_ExpireDate", expire.format(formatter));
        
            // Tạo URL thanh toán
            String paymentUrl = VNPayUtil.createPaymentUrl(
                    vnpayConfig.getPayUrl(),
                    vnpayConfig.getHashSecret(),
                    vnp_Params
            );
        
            return paymentUrl;
        }

        @Override
        public Map<String, String> processVNPayCallback(HttpServletRequest request) {
            Map<String, String> vnp_Params = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
                String paramName = params.nextElement();
                String paramValue = request.getParameter(paramName);
                vnp_Params.put(paramName, paramValue);
            }
        
            String vnp_SecureHash = vnp_Params.remove("vnp_SecureHash");
        
            // Tạo chuỗi dữ liệu để kiểm tra checksum
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }
            String mySecureHash = VNPayUtil.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
        
            Map<String, String> response = new HashMap<>();
            if (vnp_SecureHash == null || !vnp_SecureHash.equals(mySecureHash)) {
                response.put("RspCode", "97");
                response.put("Message", "Invalid Checksum");
                return response;
            }
        
            String vnp_ResponseCode = vnp_Params.get("vnp_ResponseCode");
            String vnp_TxnRef = vnp_Params.get("vnp_TxnRef");
            String vnp_Amount = vnp_Params.get("vnp_Amount");
        
            // Lấy mã hóa đơn từ vnp_TxnRef (bạn cần tách mã billCode nếu có thêm timestamp)
            String billCode = vnp_TxnRef.split("_")[0];
            Bill bill = billRepository.findByCode(billCode)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        
            if ("00".equals(vnp_ResponseCode)) {
                // Thành công
                bill.setStatus(OrderStatus.PAID);
                bill.setType(PaymentType.VNPAY);
                bill.setCompletionDate(Instant.now());
                billRepository.save(bill);
        
                // Cập nhật transaction
                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Thanh toán VNPay thành công");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);
        
                response.put("RspCode", "00");
                response.put("Message", "Success");
            } else {
                // Thất bại
                bill.setStatus(OrderStatus.PENDING);
                billRepository.save(bill);
        
                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.FAILED);
                transaction.setNote("Thanh toán VNPay thất bại");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);
        
                response.put("RspCode", vnp_ResponseCode);
                response.put("Message", "Failed from VNPay: " + vnp_ResponseCode);
            }
        
            return response;
        }
}