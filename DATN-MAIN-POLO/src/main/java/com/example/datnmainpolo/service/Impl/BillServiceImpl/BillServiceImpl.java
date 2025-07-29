package com.example.datnmainpolo.service.Impl.BillServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.CustomerRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.entity.*;
import com.example.datnmainpolo.enums.*;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.OrderHistoryService;
import com.example.datnmainpolo.service.UserService;
import com.example.datnmainpolo.service.Impl.BillDetailServiceImpl.InvoicePDFService;
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
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
        // Note: VNPayService sẽ được inject khi cần thiết qua method parameters

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
                bill.setCustomerPayment(ZERO);

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
        public PaginationResponse<BillResponseDTO> searchBillsAdvanced(String code, OrderStatus status, String phoneNumber,
                                                                       Instant startDate, Instant endDate, BigDecimal minPrice, BigDecimal maxPrice, int page, int size) {
                LOGGER.debug("Advanced search bills with code: {}, status: {}, phoneNumber: {}, startDate: {}, endDate: {}, minPrice: {}, maxPrice: {}, page: {}, size: {}",
                        code, status, phoneNumber, startDate, endDate, minPrice, maxPrice, page, size);
                Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
                Page<Bill> pageData = billRepository.findByAdvancedCriteria(
                        code != null && !code.trim().isEmpty() ? code : null,
                        status,
                        phoneNumber != null && !phoneNumber.trim().isEmpty() ? phoneNumber : null,
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
                
                try {
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
                                        // Debug: Kiểm tra voucher có tồn tại không và thuộc tính gì
                                        LOGGER.info("Searching for voucher with code: [{}] (length: {})", voucherCode, voucherCode.length());
                                        
                                        // Thử cả hai code: code gốc và code với prefix "null"
                                        Optional<Voucher> allVouchersWithCode = voucherRepository.findByCode(voucherCode);
                                        if (!allVouchersWithCode.isPresent() && !voucherCode.startsWith("null")) {
                                                LOGGER.info("Trying with null prefix: null{}", voucherCode);
                                                allVouchersWithCode = voucherRepository.findByCode("null" + voucherCode);
                                        }
                                        
                                        if (allVouchersWithCode.isPresent()) {
                                                Voucher foundVoucher = allVouchersWithCode.get();
                                                LOGGER.info("Found voucher: code={}, typeUser={}, status={}, deleted={}, startTime={}, endTime={}, quantity={}",
                                                        foundVoucher.getCode(),
                                                        foundVoucher.getTypeUser(),
                                                        foundVoucher.getStatus(),
                                                        foundVoucher.getDeleted(),
                                                        foundVoucher.getStartTime(),
                                                        foundVoucher.getEndTime(),
                                                        foundVoucher.getQuantity());
                                                
                                                // Cập nhật voucherCode với code đúng từ database
                                                voucherCode = foundVoucher.getCode();
                                        } else {
                                                LOGGER.error("No voucher found with code: {} or null{}", voucherCode, voucherCode);
                                        }
                                        
                                        appliedVoucher = voucherRepository.findByCodeAndDeletedFalse(voucherCode)
                                                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher hoặc voucher không hợp lệ"));
                                        validateVoucher(appliedVoucher, bill);
                                        applyVoucher(bill, appliedVoucher);
                                } catch (IncorrectResultSizeDataAccessException e) {
                                        LOGGER.error("Multiple vouchers found for code: {}", voucherCode, e);
                                        throw new RuntimeException("Mã voucher không duy nhất. Vui lòng kiểm tra dữ liệu.");
                                }
                        }

                        Bill savedBill = billRepository.save(bill);
                        LOGGER.info("Bill saved successfully: {}", savedBill.getId());

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
                        
                        LOGGER.info("Returning BillResponseDTO: totalMoney={}, reductionAmount={}, finalAmount={}, voucherCode={}", 
                                response.getTotalMoney(), response.getReductionAmount(), response.getFinalAmount(), response.getVoucherCode());
                        
                        return response;
                } catch (Exception e) {
                        LOGGER.error("Error applying voucher {} to bill {}: {}", voucherCode, billId, e.getMessage(), e);
                        throw e;
                }
        }

        @Override
        @Transactional
        public BillResponseDTO removeVoucherFromBill(Integer billId) {
                LOGGER.info("Removing voucher from bill {}", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // Remove voucher information
                bill.setVoucherCode(null);
                bill.setVoucherName(null);
                bill.setReductionAmount(ZERO);
                bill.setFinalAmount(calculateFinalAmount(bill));

                Bill savedBill = billRepository.save(bill);

                // Create order history entry
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(bill.getStatus());
                orderHistory.setActionDescription("Hủy voucher");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                return convertToBillResponseDTO(savedBill);
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
                                bill.setCustomerPayment(ZERO);
                        }
                }

                bill.setStatus(newStatus);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");

                // Only update typeOrder if bill is not ONLINE to avoid conflict with OnlineOrderConfirmationServiceImpl
                if (bill.getBillType() != BillType.ONLINE) {
                        List<BillDetail> billDetails = billDetailRepository.findAllByBill_Id(billId);
                        for (BillDetail detail : billDetails) {
                                detail.setTypeOrder(newStatus);
                        }
                        billDetailRepository.saveAll(billDetails);
                }

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
                        case PENDING:
                                transaction.setStatus(TransactionStatus.PENDING);
                                transaction.setNote("Chờ xử lý đơn hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case CONFIRMING:
                                transaction.setStatus(TransactionStatus.PENDING);
                                transaction.setNote("Đang xác nhận đơn hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case DELIVERING:
                                if (transaction.getStatus() != TransactionStatus.SUCCESS) {
                                        throw new RuntimeException("Không thể giao hàng cho đơn hàng chưa thanh toán");
                                }
                                transaction.setNote("Đang giao hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
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

                BigDecimal finalAmount = calculateFinalAmount(bill);
                if (finalAmount == null) {
                        LOGGER.error("Final amount is null for bill {}", billId);
                        throw new RuntimeException("Không thể tính toán số tiền cuối cùng");
                }

                boolean hasCustomerInfo = bill.getCustomerInfor() != null;

                PaymentResponseDTO response;
                switch (paymentType) {
                        case CASH:
                                response = processCashPayment(bill, finalAmount, amount, hasCustomerInfo);
                                break;
                        case BANKING:
                                response = processBankingPayment(bill, finalAmount, hasCustomerInfo);
                                break;
                        case VNPAY:
                                response = processVNPayPayment(bill, finalAmount, hasCustomerInfo);
                                break;
                        case COD:
                                response = processCODPayment(bill, finalAmount, hasCustomerInfo);
                                break;
                        default:
                                throw new RuntimeException("Loại thanh toán không hợp lệ");
                }

                if (hasCustomerInfo && bill.getStatus() == OrderStatus.PENDING) {
                        LOGGER.info("Bill {} has customer information, updating status to CONFIRMING", billId);
                        bill.setStatus(OrderStatus.CONFIRMING);
                        bill.setBillType(BillType.ONLINE);
                        bill.setUpdatedAt(Instant.now());
                        bill.setUpdatedBy("system");

                        billDetailService.updateBillDetailTypeOrder(billId, OrderStatus.CONFIRMING);

                        OrderHistory orderHistory = new OrderHistory();
                        orderHistory.setBill(bill);
                        orderHistory.setStatusOrder(OrderStatus.CONFIRMING);
                        orderHistory.setActionDescription("Cập nhật trạng thái hóa đơn thành CONFIRMING do có thông tin khách hàng");
                        orderHistory.setCreatedAt(Instant.now());
                        orderHistory.setUpdatedAt(Instant.now());
                        orderHistory.setCreatedBy("system");
                        orderHistory.setUpdatedBy("system");
                        orderHistory.setDeleted(false);
                        orderHistoryRepository.save(orderHistory);
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
                                                      boolean hasCustomerInfo) {
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
                bill.setCustomerPayment(amount.setScale(2, RoundingMode.HALF_UP));

                bill.setStatus(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PAID);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                if (bill.getCustomer() != null && bill.getStatus() == OrderStatus.PAID) {
                        BigDecimal orderValue = bill.getFinalAmount();
                        userService.updateLoyaltyPoints(bill.getCustomer().getId(), orderValue);
                }

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        if (bill.getStatus() == OrderStatus.PENDING) {
                                billDetail.setTypeOrder(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PAID);
                        }
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy("system");
                        billDetailRepository.save(billDetail);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(hasCustomerInfo ? TransactionType.ONLINE : TransactionType.PAYMENT);
                transaction.setTotalMoney(amount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Thanh toán tiền mặt thành công" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                        .build();
        }

        private PaymentResponseDTO processVNPayPayment(Bill bill, BigDecimal finalAmount,
                                                       boolean hasCustomerInfo) {
                LOGGER.info("Processing VNPay payment for bill {} with amount {}", bill.getId(), finalAmount);
                if (finalAmount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }

                bill.setType(PaymentType.VNPAY);
                bill.setCustomerPayment(finalAmount.setScale(2, RoundingMode.HALF_UP));
                bill.setFinalAmount(finalAmount.setScale(2, RoundingMode.HALF_UP));
                bill.setStatus(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        if (bill.getStatus() == OrderStatus.PENDING) {
                                billDetail.setTypeOrder(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PAID);
                        }
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy("system");
                        billDetailRepository.save(billDetail);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                transaction.setTotalMoney(finalAmount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán VNPay" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                        .build();
        }

        private PaymentResponseDTO processCODPayment(Bill bill, BigDecimal finalAmount, boolean hasCustomerInfo) {
                LOGGER.info("Processing COD payment for bill {} with amount {}", bill.getId(), finalAmount);

                bill.setType(PaymentType.COD);
//                bill.setCustomerPayment(finalAmount.setScale(2, RoundingMode.HALF_UP));
                bill.setFinalAmount(finalAmount.setScale(2, RoundingMode.HALF_UP));
                bill.setStatus(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        if (bill.getStatus() == OrderStatus.PENDING) {
                                billDetail.setTypeOrder(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PAID);
                        }
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy("system");
                        billDetailRepository.save(billDetail);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                transaction.setTotalMoney(finalAmount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán COD" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                        .build();
        }

        private PaymentResponseDTO processBankingPayment(Bill bill, BigDecimal finalAmount, boolean hasCustomerInfo) {
                LOGGER.info("Processing Banking payment for bill {} with amount {}", bill.getId(), finalAmount);
                if (finalAmount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }

                bill.setType(PaymentType.BANKING);
                bill.setCustomerPayment(finalAmount.setScale(2, RoundingMode.HALF_UP));
                bill.setFinalAmount(finalAmount.setScale(2, RoundingMode.HALF_UP));
                bill.setStatus(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        if (bill.getStatus() == OrderStatus.PENDING) {
                                billDetail.setTypeOrder(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PAID);
                        }
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy("system");
                        billDetailRepository.save(billDetail);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                transaction.setTotalMoney(finalAmount.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán Banking" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(finalAmount.setScale(2, RoundingMode.HALF_UP))
                        .build();
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
                LOGGER.info("Fetching details for bill {}", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
                return convertToBillResponseDTO(bill);
        }

        @Override
        public PaginationResponse<BillResponseDTO> getCustomerBills(Integer customerId, OrderStatus status, int page, int size) {
                LOGGER.info("Fetching bills for customer {} with status: {}, page: {}, size: {}", customerId, status, page, size);
                
                try {
                        // Validate customer exists
                        userRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));

                        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
                        Page<Bill> billPage;

                        if (status != null) {
                                billPage = billRepository.findByCustomerIdAndStatusAndDeletedFalse(customerId, status, pageable);
                        } else {
                                billPage = billRepository.findByCustomerIdAndDeletedFalse(customerId, pageable);
                        }

                        List<BillResponseDTO> billResponseDTOs = billPage.getContent().stream()
                                .map(this::convertToBillResponseDTO)
                                .collect(Collectors.toList());

                        PaginationResponse<BillResponseDTO> response = new PaginationResponse<>();
                        response.setContent(billResponseDTOs);
                        response.setCurrentPage(billPage.getNumber());
                        response.setPageSize(billPage.getSize());
                        response.setTotalElements(billPage.getTotalElements());
                        response.setTotalPages(billPage.getTotalPages());
                        response.setLast(billPage.isLast());

                        return response;
                } catch (Exception e) {
                        LOGGER.error("Error fetching bills for customer {}: {}", customerId, e.getMessage(), e);
                        throw new RuntimeException("Lỗi khi lấy danh sách đơn hàng: " + e.getMessage());
                }
        }

        @Override
        public void applyBestPublicVoucher(Bill bill) {
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
                BigDecimal finalAmount = totalMoney.subtract(reductionAmount)
                        .add(bill.getMoneyShip() != null ? bill.getMoneyShip() : ZERO);
                bill.setFinalAmount(finalAmount);

                // Chỉ cập nhật customerPayment nếu hóa đơn ở trạng thái PAID và phương thức thanh toán là BANKING hoặc VNPAY
                if (bill.getStatus() == OrderStatus.PAID &&
                        (bill.getType() == PaymentType.BANKING || bill.getType() == PaymentType.VNPAY)) {
                        bill.setCustomerPayment(finalAmount);
                }
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
                
                // Chỉ cho phép voucher PUBLIC cho admin bán hàng tại quầy
                if (voucher.getTypeUser() != VoucherTypeUser.PUBLIC) {
                        throw new RuntimeException("Chỉ được sử dụng voucher PUBLIC");
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

        @Override
        public BillResponseDTO convertToBillResponseDTO(Bill bill) {
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
                        .customerId(bill.getCustomer() != null ? bill.getCustomer().getId() : null) // Handle null customer
                        .phoneNumber(bill.getPhoneNumber())
                        .address(bill.getAddress())
                        .billType(bill.getBillType())
                        .totalMoney(bill.getTotalMoney())
                        .reductionAmount(bill.getReductionAmount())
                        .moneyShip(bill.getMoneyShip())
                        .finalAmount(bill.getFinalAmount())
                        .customerPayment(bill.getCustomerPayment())
                        .createdAt(bill.getCreatedAt())
                        .employeeName(bill.getEmployee() != null ? bill.getEmployee().getName() : null)
                        .type(bill.getType())
                        .createdBy(bill.getCreatedBy())
                        .updatedBy(bill.getUpdatedBy())
                        .voucherCode(bill.getVoucherCode())
                        .voucherName(bill.getVoucherName())
                        .voucherDiscountAmount(voucherDiscountAmount)
                        .voucherType(voucherType)
                        .build();
        }

        @Override
        public BillResponseDTO convertToBillResponseDTO2(Bill bill) {
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
                        .customerId(bill.getCustomer() != null ? bill.getCustomer().getId() : null) // Handle null customer
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
                        .updatedBy(bill.getUpdatedBy())
                        .voucherCode(bill.getVoucherCode())
                        .voucherName(bill.getVoucherName())
                        .voucherDiscountAmount(voucherDiscountAmount)
                        .voucherType(voucherType)
                        .build();
        }

        @Override
        public BillResponseDTO addLoyalCustomerToBill(Integer billId, Integer customerId) {
                LOGGER.info("Adding loyal customer {} to bill {}", customerId, billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                UserEntity customer = userRepository.findById(customerId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));
                bill.setCustomer(customer);
                bill.setCustomerName(customer.getName());
                bill.setPhoneNumber(customer.getPhoneNumber());
                bill.setAddress(customer.getAddress());
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");

                Bill savedBill = billRepository.save(bill);

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(savedBill.getStatus());
                orderHistory.setActionDescription("Thêm khách hàng trung thành " + customer.getName() + " vào hóa đơn");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                return convertToBillResponseDTO(savedBill);
        }

        @Override
        public BillResponseDTO addVisitingGuests(Integer billId, CustomerRequestDTO requestDTO) {
                LOGGER.info("Adding visiting guest to bill {}", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                bill.setCustomerName(requestDTO.getName());
                bill.setPhoneNumber(requestDTO.getPhoneNumber());

                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("server");

                UserEntity newUser = new UserEntity();
                newUser.setName(requestDTO.getName());
                newUser.setPhoneNumber(requestDTO.getPhoneNumber());
                newUser.setRole(Role.CLIENT);
                newUser.setDeleted(false);
                userRepository.save(newUser);

                bill.setCustomer(newUser); // Link the new user to the bill

                Bill savedBill = billRepository.save(bill);

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(savedBill.getStatus());
                orderHistory.setActionDescription("Thêm khách vãng lai vào hóa đơn");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                return convertToBillResponseDTO(savedBill);
        }

        @Override
        @Transactional
        public BillResponseDTO addUserToBill(Integer billId, UserRequestDTO userRequestDTO) {
                LOGGER.info("Adding user to bill {}", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));


                userRequestDTO.setRole(Role.CLIENT);

                UserEntity user = userRepository.findById(userRequestDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Không thể tìm thấy người dùng vừa tạo"));

                bill.setCustomer(user);
                bill.setCustomerName(user.getName());
                bill.setPhoneNumber(user.getPhoneNumber());
                bill.setAddress(user.getAddress());
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");

                Bill savedBill = billRepository.save(bill);

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(savedBill.getStatus());
                orderHistory.setActionDescription("Thêm người dùng " + user.getName() + " vào hóa đơn");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                return convertToBillResponseDTO(savedBill);
        }

        @Override
        public void validateBillForDelivery(Integer billId) {
                LOGGER.info("Validating bill {} for delivery eligibility", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
                if (bill.getCustomer() == null) {
                        throw new RuntimeException("Hóa đơn phải có người dùng đăng ký để sử dụng chức năng giao hàng");
                }
        }

        @Override
        @Transactional
        public BillResponseDTO confirmBankingPayment(Integer billId) {
                LOGGER.info("Confirming banking payment for bill {}", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                if (bill.getType() != PaymentType.BANKING) {
                        throw new RuntimeException("Chỉ có thể xác nhận thanh toán cho hóa đơn Banking");
                }

                if (bill.getStatus() != OrderStatus.PENDING && bill.getStatus() != OrderStatus.CONFIRMING) {
                        throw new RuntimeException("Không thể xác nhận thanh toán cho hóa đơn có trạng thái " + bill.getStatus());
                }

                // Cập nhật trạng thái hóa đơn thành PAID
                bill.setStatus(OrderStatus.PAID);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");

                // Cập nhật trạng thái giao dịch
                Transaction transaction = transactionRepository.findByBillId(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Xác nhận thanh toán Banking thành công");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                // Cập nhật trạng thái bill details
                List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        billDetail.setTypeOrder(OrderStatus.PAID);
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy("system");
                        billDetailRepository.save(billDetail);
                }

                // Giảm số lượng voucher nếu có
                if (bill.getVoucherCode() != null) {
                        decrementVoucherQuantity(bill.getVoucherCode());
                }

                // Cập nhật điểm loyalty cho khách hàng nếu có
                if (bill.getCustomer() != null) {
                        BigDecimal orderValue = bill.getFinalAmount();
                        userService.updateLoyaltyPoints(bill.getCustomer().getId(), orderValue);
                }

                // Tạo order history
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(OrderStatus.PAID);
                orderHistory.setActionDescription("Xác nhận thanh toán Banking thành công");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy("system");
                orderHistory.setUpdatedBy("system");
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                Bill savedBill = billRepository.save(bill);
                return convertToBillResponseDTO(savedBill);
        }
}