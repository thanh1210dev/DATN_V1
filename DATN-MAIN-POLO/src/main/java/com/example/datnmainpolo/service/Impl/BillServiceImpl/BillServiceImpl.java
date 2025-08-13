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
import com.example.datnmainpolo.service.Impl.Email.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.EnumSet;

@Service
@RequiredArgsConstructor
@SuppressWarnings({"unused"})
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
        private final EmailService emailService;
        private final BillReturnRepository billReturnRepository;

        private String getActor() {
        try {
            String username = SecurityContextHolder.getContext() != null &&
                    SecurityContextHolder.getContext().getAuthentication() != null
                    ? SecurityContextHolder.getContext().getAuthentication().getName()
                    : null;
                        if (username == null || "anonymousUser".equalsIgnoreCase(username)) return "guest";
            return userRepository.findByEmail(username)
                    .map(u -> u.getName() != null ? u.getName() : username)
                    .orElse(username);
        } catch (Exception e) {
                        return "guest";
        }
    }

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
                // initialize new statuses
                bill.setPaymentStatus(PaymentStatus.UNPAID);
                bill.setFulfillmentStatus(FulfillmentStatus.PENDING);

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
                        orderHistory.setCreatedBy(getActor());
                        orderHistory.setUpdatedBy(getActor());
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
                orderHistory.setCreatedBy(getActor());
                orderHistory.setUpdatedBy(getActor());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                return convertToBillResponseDTO(savedBill);
        }

        @Override
        @Transactional
        public BillResponseDTO updateBillStatus(Integer billId, OrderStatus newStatus) {
                LOGGER.info("🔄 Updating bill {} status to {}", billId, newStatus);
                LOGGER.info("🔄 Service method entry at: {}", java.time.Instant.now());
                
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
                LOGGER.info("✅ Bill found: ID={}, currentStatus={}, billType={}", bill.getId(), bill.getStatus(), bill.getBillType());

                // Guard: block status updates while a return request is pending approval
                boolean hasPendingReturn = billReturnRepository.existsByBill_IdAndStatus(billId, ReturnStatus.REQUESTED);
                if (hasPendingReturn) {
                        throw new RuntimeException("Không thể cập nhật trạng thái hóa đơn khi đang có yêu cầu trả hàng chờ duyệt");
                }

                OrderStatus currentStatus = bill.getStatus();
                LOGGER.info("📊 Current status: {}, Target status: {}, Bill type: {}", currentStatus, newStatus, bill.getBillType());
                // Fetch transaction early for decision logic below
                Transaction earlyTxn = transactionRepository.findByBillId(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

// cộng số lượng sản phẩm khi hủy đơn   
                if (newStatus == OrderStatus.CANCELLED) {
                        List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
                        
                        // Only restore inventory if it was already reduced 
                        // COD orders before CONFIRMED status haven't had inventory reduced yet
                        boolean shouldRestoreInventory = true;
                        if (bill.getType() == PaymentType.COD && 
                            (currentStatus == OrderStatus.PENDING || currentStatus == OrderStatus.CONFIRMING)) {
                                shouldRestoreInventory = false;
                                LOGGER.info("🔄 COD order cancelled before confirmation - no inventory to restore");
                        } else if ((bill.getType() == PaymentType.VNPAY || bill.getType() == PaymentType.BANKING)
                                && earlyTxn.getStatus() != TransactionStatus.SUCCESS) {
                                // Online payments (VNPay/Banking) that failed/cancelled before success didn't deduct inventory yet
                                shouldRestoreInventory = false;
                                LOGGER.info("🔄 Online order ({}:{}) cancelled before payment success - no inventory to restore",
                                        bill.getType(), earlyTxn.getStatus());
                        }
                        
                        if (shouldRestoreInventory) {
                                LOGGER.info("🔄 Restoring inventory for cancelled order");
                                for (BillDetail detail : billDetails) {
                                        ProductDetail productDetail = detail.getDetailProduct();
                                        productDetail.setQuantity(productDetail.getQuantity() + detail.getQuantity());
                                        if (productDetail.getQuantity() > 0) {
                                                productDetail.setStatus(ProductStatus.AVAILABLE);
                                        }
                                        productDetailRepository.save(productDetail);
                                        LOGGER.info("🔄 Restored {} units for product {}", detail.getQuantity(), productDetail.getCode());
                                }
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
                // reflect to new axes
                FulfillmentStatus mapped = mapOrderStatusToFulfillment(newStatus);
                if (mapped != null) {
                    bill.setFulfillmentStatus(mapped);
                }
                if (newStatus == OrderStatus.PAID) {
                    bill.setPaymentStatus(PaymentStatus.PAID);
                } else if (newStatus == OrderStatus.REFUNDED) {
                    bill.setPaymentStatus(PaymentStatus.REFUNDED);
                } else if (newStatus == OrderStatus.CANCELLED) {
                    if (bill.getPaymentStatus() == null || bill.getPaymentStatus() == PaymentStatus.UNPAID || bill.getPaymentStatus() == PaymentStatus.PENDING) {
                        bill.setPaymentStatus(PaymentStatus.FAILED);
                    }
                }
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy(getActor());

                // Update BillDetail status in bulk ONLY when not in a return-related order status
                boolean isReturnFlow = EnumSet.of(
                        OrderStatus.RETURN_REQUESTED,
                        OrderStatus.RETURNED,
                        OrderStatus.REFUNDED,
                        OrderStatus.RETURN_COMPLETED
                ).contains(newStatus);

                if (!isReturnFlow) {
                        List<BillDetail> billDetails = billDetailRepository.findAllByBill_Id(billId);
                        BillDetailStatus mappedDetailStatus = mapOrderStatusToBillDetailStatus(newStatus);
                        if (mappedDetailStatus != null) {
                                for (BillDetail detail : billDetails) {
                                        // Don't override lines that were explicitly marked RETURNED by the return workflow
                                        if (detail.getStatus() == BillDetailStatus.RETURNED) {
                                                continue;
                                        }
                                        BillDetailStatus old = detail.getStatus();
                                        detail.setStatus(mappedDetailStatus);
                                        LOGGER.info("🔄 Updated BillDetail {} status from {} to {}", detail.getId(), old, mappedDetailStatus);
                                }
                                billDetailRepository.saveAll(billDetails);
                        }
                }

                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(newStatus);
                orderHistory.setActionDescription("Cập nhật trạng thái từ " + currentStatus + " sang " + newStatus);
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(getActor());
                orderHistory.setUpdatedBy(getActor());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                Transaction transaction = transactionRepository.findByBillId(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                LOGGER.info("🔍 Transaction found: ID={}, Status={}, Type={}", transaction.getId(), transaction.getStatus(), transaction.getType());

                                // If attempting to advance beyond CONFIRMING for a COD order without explicit CONFIRMED step, ensure inventory deduction now
                                if (bill.getType() == PaymentType.COD
                                                && currentStatus == OrderStatus.CONFIRMING
                                                && (newStatus == OrderStatus.PACKED || newStatus == OrderStatus.DELIVERING
                                                        || newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.COMPLETED)) {
                                                LOGGER.info("🔄 Skipped CONFIRMED step for COD bill {} - performing inventory deduction before {}", billId, newStatus);
                                                deductInventoryForCOD(billId);
                                }

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
                        case CONFIRMED:
                                if (bill.getType() == PaymentType.COD) {
                                        LOGGER.info("🔄 Reducing inventory for confirmed COD order {}", billId);
                                        deductInventoryForCOD(billId);
                                }
                                transaction.setNote("Đã xác nhận đơn hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case PACKED:
                                transaction.setNote("Đã đóng gói đơn hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case DELIVERING:
                                // Cho phép giao hàng với COD (chưa thanh toán) hoặc đã thanh toán
                                if (transaction.getStatus() != TransactionStatus.SUCCESS && 
                                    !(bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING)) {
                                        throw new RuntimeException("Không thể giao hàng cho đơn hàng này");
                                }
                                transaction.setNote("Đang giao hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case DELIVERED:
                                // Cho phép đánh dấu đã giao với COD (chưa thanh toán) hoặc đã thanh toán
                                if (transaction.getStatus() != TransactionStatus.SUCCESS && 
                                    !(bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING)) {
                                        throw new RuntimeException("Không thể đánh dấu đã giao cho đơn hàng này");
                                }
                                transaction.setNote("Đã giao hàng thành công");
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
                                transaction.setType(TransactionType.REFUND); // mark as refund transaction for reporting
                                transaction.setNote("Hoàn tiền cho khách hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case COMPLETED:
                                LOGGER.info("✅ Processing COMPLETED status for bill {}", billId);
                                LOGGER.info("🔍 Transaction status before validation: {}", transaction.getStatus());
                                if (transaction.getStatus() != TransactionStatus.SUCCESS) {
                                        LOGGER.error("❌ Cannot complete unpaid order. Transaction status: {}", transaction.getStatus());
                                        LOGGER.error("❌ Required status: SUCCESS, Current status: {}", transaction.getStatus());
                                        throw new RuntimeException("Không thể hoàn thành đơn hàng chưa thanh toán");
                                }
                                LOGGER.info("✅ Transaction status validation passed");
                                transaction.setNote("Đơn hàng hoàn thành");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                LOGGER.info("✅ Transaction updated for COMPLETED status");
                                break;
                        case RETURN_REQUESTED:
                                transaction.setNote("Yêu cầu trả hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                        case RETURNED:
                                LOGGER.info("🔄 Processing RETURNED for bill {}", billId);
                                LOGGER.info("🔍 Current transaction status: {}, Bill payment type: {}", 
                                    transaction.getStatus(), bill.getType());
                                
                                // Chấp nhận trả hàng cho các trường hợp: đã thanh toán hoặc COD chưa thanh toán
                                if (transaction.getStatus() != TransactionStatus.SUCCESS && 
                                    !(bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING)) {
                                        LOGGER.error("❌ Cannot return order with transaction status: {}", transaction.getStatus());
                                        throw new RuntimeException("Không thể trả hàng cho đơn hàng này");
                                }
                                
                                // Khôi phục số lượng sản phẩm ngay khi trả hàng
                                List<BillDetail> billDetailsToReturn = billDetailRepository.findByBillId(billId);
                                LOGGER.info("🔄 Restoring {} products to inventory for RETURNED", billDetailsToReturn.size());
                                for (BillDetail detail : billDetailsToReturn) {
                                        ProductDetail productDetail = detail.getDetailProduct();
                                        productDetail.setQuantity(productDetail.getQuantity() + detail.getQuantity());
                                        if (productDetail.getQuantity() > 0) {
                                                productDetail.setStatus(ProductStatus.AVAILABLE);
                                        }
                                        productDetailRepository.save(productDetail);
                                        LOGGER.info("🔄 Restored {} units of product {} (new quantity: {})", 
                                            detail.getQuantity(), productDetail.getCode(), productDetail.getQuantity());
                                }
                                
                                // Không khôi phục voucher ở bước RETURNED để tránh cộng trùng. Sẽ khôi phục ở RETURN_COMPLETED.
                                
                                transaction.setNote("Đã xử lý trả hàng - Khôi phục sản phẩm về kho");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                LOGGER.info("✅ Products restored to inventory for bill {}", billId);
                                break;
                        case RETURN_COMPLETED:
                                LOGGER.info("🔄 Processing RETURN_COMPLETED for bill {}", billId);
                                LOGGER.info("🔍 Current transaction status: {}, Bill payment type: {}", 
                                    transaction.getStatus(), bill.getType());
                                boolean firstTimeReturnCompleted = (currentStatus != OrderStatus.RETURN_COMPLETED);
                                
                                // Hoàn tất trả hàng - chấp nhận cho: đã thanh toán, COD chưa thanh toán, hoặc đã hoàn tiền
                                if (transaction.getStatus() != TransactionStatus.SUCCESS && 
                                    transaction.getStatus() != TransactionStatus.REFUNDED &&
                                    !(bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING)) {
                                        LOGGER.error("❌ Validation failed for RETURN_COMPLETED: transaction.status={}, bill.type={}", 
                                            transaction.getStatus(), bill.getType());
                                        throw new RuntimeException("Không thể hoàn tất trả hàng cho đơn hàng này");
                                }
                                
                                LOGGER.info("✅ Validation passed for RETURN_COMPLETED");
                                
                                // Lưu ý: Không khôi phục tồn kho ở bước RETURN_COMPLETED để tránh cộng trùng.
                                // Tồn kho đã được khôi phục tại bước RETURNED khi hàng về kho.
                                
                                // Cập nhật transaction status - nếu COD chưa thanh toán thì chuyển thành CANCELLED, ngược lại giữ/ref thành REFUNDED
                                if (bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING) {
                                        transaction.setStatus(TransactionStatus.CANCELLED);
                                        transaction.setNote("Hoàn tất trả hàng COD - khách hàng không nhận");
                                        LOGGER.info("🔄 Updated transaction status to CANCELLED for COD");
                                } else {
                                        // Nếu đã REFUNDED thì giữ nguyên, ngược lại chuyển thành REFUNDED
                                        if (transaction.getStatus() != TransactionStatus.REFUNDED) {
                                                transaction.setStatus(TransactionStatus.REFUNDED);
                                                transaction.setType(TransactionType.REFUND); // mark as refund transaction for reporting
                                                LOGGER.info("🔄 Updated transaction status to REFUNDED");
                                        } else {
                                                LOGGER.info("🔄 Keeping transaction status as REFUNDED");
                                        }
                                        transaction.setNote("Hoàn tất trả hàng - đã hoàn tiền cho khách hàng");
                                }
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                
                                // Khôi phục voucher nếu có - chỉ thực hiện lần đầu chuyển sang RETURN_COMPLETED để tránh cộng trùng
                                if (firstTimeReturnCompleted && bill.getVoucherCode() != null) {
                                        try {
                                                Optional<Voucher> voucherOpt = voucherRepository.findByCodeAndDeletedFalse(bill.getVoucherCode());
                                                if (voucherOpt.isPresent()) {
                                                        Voucher voucher = voucherOpt.get();
                                                        voucher.setQuantity(voucher.getQuantity() + 1);
                                                        if (voucher.getStatus() == PromotionStatus.USED_UP) {
                                                                voucher.setStatus(PromotionStatus.ACTIVE);
                                                        }
                                                        voucherRepository.save(voucher);
                                                        LOGGER.info("Restored voucher {} quantity to {}", voucher.getCode(), voucher.getQuantity());
                                                }
                                        } catch (Exception e) {
                                                LOGGER.error("Error restoring voucher {}: {}", bill.getVoucherCode(), e.getMessage());
                                        }
                                }
                                break;
                        case DELIVERY_FAILED:
                                transaction.setNote("Giao hàng thất bại");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;
                }

                // Đồng bộ PaymentStatus sau khi hoàn tất luồng trả hàng
                if (newStatus == OrderStatus.RETURN_COMPLETED) {
                        if (transaction.getStatus() == TransactionStatus.REFUNDED) {
                                bill.setPaymentStatus(PaymentStatus.REFUNDED);
                        } else if (bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.CANCELLED) {
                                // COD chưa thanh toán và đã hủy giao dịch => đánh dấu thất bại thanh toán
                                if (bill.getPaymentStatus() == PaymentStatus.PENDING || bill.getPaymentStatus() == PaymentStatus.UNPAID) {
                                        bill.setPaymentStatus(PaymentStatus.FAILED);
                                }
                        }
                }

                Bill savedBill = billRepository.save(bill);
                LOGGER.info("✅ Bill status successfully updated from {} to {} for bill {}", currentStatus, newStatus, billId);
                LOGGER.info("✅ Saved bill status: {}", savedBill.getStatus());
                
                // Force flush để đảm bảo transaction được commit ngay lập tức
                billRepository.flush();
                LOGGER.info("🔄 Database transaction flushed for bill {}", billId);
                
                BillResponseDTO responseDTO = convertToBillResponseDTO(savedBill);
                LOGGER.info("✅ Returning response with status: {}", responseDTO.getStatus());
                LOGGER.info("🔍 Full response DTO: id={}, code={}, status={}, billType={}", 
                    responseDTO.getId(), responseDTO.getCode(), responseDTO.getStatus(), responseDTO.getBillType());
                return responseDTO;
        }

        @Override
        @Transactional
        public BillResponseDTO updateBillStatusWithPayment(Integer billId, OrderStatus newStatus, BigDecimal amount) {
                LOGGER.info("🔄 Updating bill {} status to {} with payment amount {}", billId, newStatus, amount);
                
                // For now, just delegate to the regular updateBillStatus method
                // This method is here to satisfy the interface requirement from VNPay integration
                // The amount parameter can be used for future payment tracking enhancements
                return updateBillStatus(billId, newStatus);
        }

        @Override
        @Transactional
        public PaymentResponseDTO processPayment(Integer billId, PaymentType paymentType, BigDecimal amount) {
                LOGGER.info("Processing payment for bill {} with type {}", billId, paymentType);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // Guard: prevent payment if no products in bill
                List<BillDetail> currentDetails = billDetailRepository.findByBillId(billId);
                if (currentDetails == null || currentDetails.isEmpty()) {
                        throw new RuntimeException("Hóa đơn chưa có sản phẩm, không thể thanh toán");
                }

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

                if (hasCustomerInfo && paymentType == PaymentType.COD && bill.getStatus() == OrderStatus.PENDING) {
                        LOGGER.info("Bill {} has customer information and COD payment, updating status to CONFIRMING", billId);
                        bill.setStatus(OrderStatus.CONFIRMING);
                        bill.setBillType(BillType.ONLINE);
                        bill.setUpdatedAt(Instant.now());
                        bill.setUpdatedBy(getActor());

                        // typeOrder removed; no per-line workflow update needed

                        OrderHistory orderHistory = new OrderHistory();
                        orderHistory.setBill(bill);
                        orderHistory.setStatusOrder(OrderStatus.CONFIRMING);
                        orderHistory.setActionDescription("Cập nhật trạng thái hóa đơn COD thành CONFIRMING do có thông tin khách hàng");
                        orderHistory.setCreatedAt(Instant.now());
                        orderHistory.setUpdatedAt(Instant.now());
                        orderHistory.setCreatedBy(getActor());
                        orderHistory.setUpdatedBy(getActor());
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
                // new statuses
                bill.setPaymentStatus(PaymentStatus.PAID);
                // Tại quầy không có thông tin giao hàng: để giao vận ở trạng thái 'PENDING' (chưa giao)
                // Tại quầy (không có địa chỉ giao hàng) giữ giao vận ở 'PENDING'
                bill.setFulfillmentStatus(hasCustomerInfo ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy(getActor());
                Bill savedBill = billRepository.save(bill);

                // ⭐ Tạo OrderHistory entry cho việc thanh toán
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(savedBill.getStatus());
                orderHistory.setActionDescription(hasCustomerInfo ? "Thanh toán thành công, chuyển sang xác nhận" : "Thanh toán tại quầy thành công");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(getActor());
                orderHistory.setUpdatedBy(getActor());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                if (bill.getCustomer() != null && bill.getStatus() == OrderStatus.PAID) {
                        BigDecimal orderValue = bill.getFinalAmount();
                        userService.updateLoyaltyPoints(bill.getCustomer().getId(), orderValue);
                }

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                // ⭐ OFFLINE (tại quầy) phải trừ kho ngay khi thanh toán thành công (trước khi set status PRODUCT)
                boolean isOfflineImmediate = !hasCustomerInfo; // không có thông tin giao hàng => tại quầy
                if (isOfflineImmediate) {
                        LOGGER.info("🔄 Deducting inventory for offline cash bill {}", savedBill.getId());
                        // Validate toàn bộ trước
                        for (BillDetail line : billDetails) {
                                ProductDetail pd = line.getDetailProduct();
                                if (pd == null) continue;
                                int avail = pd.getQuantity();
                                int need = line.getQuantity();
                                if (avail < need) {
                                        throw new RuntimeException("Sản phẩm " + pd.getCode() + " không đủ số lượng. Còn: " + avail + ", cần: " + need);
                                }
                        }
                        // Deduct
                        for (BillDetail line : billDetails) {
                                ProductDetail pd = line.getDetailProduct();
                                if (pd == null) continue;
                                int before = pd.getQuantity();
                                int after = before - line.getQuantity();
                                pd.setQuantity(after);
                                if (after <= 0) {
                                        pd.setStatus(ProductStatus.OUT_OF_STOCK);
                                } else {
                                        pd.setStatus(ProductStatus.AVAILABLE);
                                }
                                productDetailRepository.save(pd);
                                LOGGER.info("🔄 Product {} deducted {} ({} -> {})", pd.getCode(), line.getQuantity(), before, after);
                        }
                }

                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy(getActor());
                        billDetailRepository.save(billDetail);
                        // Sau khi trừ kho (nếu có) đã cập nhật status; nếu ONLINE (hasCustomerInfo) chỉ set status hiển thị
                        if (!isOfflineImmediate) {
                                ProductDetail productDetail = billDetail.getDetailProduct();
                                if (productDetail != null) {
                                        productDetail.setStatus(productDetail.getQuantity() > 0 ? ProductStatus.AVAILABLE : ProductStatus.OUT_OF_STOCK);
                                        productDetailRepository.save(productDetail);
                                }
                        }
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
                LOGGER.info("VNPay Payment - Current bill info: voucherCode={}, reductionAmount={}, finalAmount={}", 
                           bill.getVoucherCode(), bill.getReductionAmount(), bill.getFinalAmount());
                if (finalAmount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }

                bill.setType(PaymentType.VNPAY);
                // Sử dụng finalAmount hiện tại của bill (đã tính voucher) thay vì parameter
                BigDecimal actualFinalAmount = bill.getFinalAmount() != null ? bill.getFinalAmount() : finalAmount;
                bill.setCustomerPayment(actualFinalAmount.setScale(2, RoundingMode.HALF_UP));
                // Không ghi đè finalAmount nếu đã có voucher được áp dụng
                if (bill.getFinalAmount() == null || bill.getFinalAmount().compareTo(ZERO) == 0) {
                        bill.setFinalAmount(finalAmount.setScale(2, RoundingMode.HALF_UP));
                } else {
                        LOGGER.info("VNPay Payment - Keeping existing finalAmount with voucher: {}", bill.getFinalAmount());
                }
                // VNPay payment sẽ được cập nhật thành PAID trong VNPayServiceImpl sau khi thanh toán thành công
                // Tạm thời giữ PENDING để chờ VNPay callback
                bill.setStatus(OrderStatus.PENDING);
                // Set BillType dựa trên có thông tin khách hàng hay không
                bill.setBillType(hasCustomerInfo ? BillType.ONLINE : BillType.OFFLINE);
                // new statuses
                bill.setPaymentStatus(PaymentStatus.PENDING);
                bill.setFulfillmentStatus(hasCustomerInfo ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy(getActor());
                Bill savedBill = billRepository.save(bill);

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        if (bill.getStatus() == OrderStatus.PENDING) {
                                // typeOrder removed from BillDetail
                        }
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy(getActor());
                        billDetailRepository.save(billDetail);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                // Sử dụng finalAmount thực tế từ bill (đã có voucher)
                BigDecimal actualFinalAmountForTransaction = savedBill.getFinalAmount() != null ? savedBill.getFinalAmount() : finalAmount;
                transaction.setTotalMoney(actualFinalAmountForTransaction.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán VNPay" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(actualFinalAmountForTransaction.setScale(2, RoundingMode.HALF_UP))
                        .build();
        }

        private PaymentResponseDTO processCODPayment(Bill bill, BigDecimal finalAmount, boolean hasCustomerInfo) {
                LOGGER.info("Processing COD payment for bill {} with amount {}", bill.getId(), finalAmount);
                LOGGER.info("COD Payment - Current bill info: voucherCode={}, reductionAmount={}, finalAmount={}", 
                           bill.getVoucherCode(), bill.getReductionAmount(), bill.getFinalAmount());

                bill.setType(PaymentType.COD);
                // Không ghi đè finalAmount nếu đã có voucher được áp dụng
                // finalAmount parameter là giá trị đã tính toán từ calculateFinalAmount(bill) 
                // nên có thể an toàn sử dụng
                if (bill.getFinalAmount() == null || bill.getFinalAmount().compareTo(ZERO) == 0) {
                        bill.setFinalAmount(finalAmount.setScale(2, RoundingMode.HALF_UP));
                } else {
                        LOGGER.info("COD Payment - Keeping existing finalAmount with voucher: {}", bill.getFinalAmount());
                }
                bill.setStatus(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
                // new statuses
                bill.setPaymentStatus(PaymentStatus.UNPAID);
                bill.setFulfillmentStatus(hasCustomerInfo ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy(getActor());
                Bill savedBill = billRepository.save(bill);

                // COD: không đánh dấu chi tiết là ĐÃ THANH TOÁN tại thời điểm tạo đơn; thanh toán khi giao hàng
                // Giữ nguyên trạng thái chi tiết theo mapping chung (thường là PENDING tới khi giao/thu tiền)

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                // Sử dụng finalAmount thực tế từ bill (đã có voucher)
                BigDecimal actualFinalAmountCOD = savedBill.getFinalAmount() != null ? savedBill.getFinalAmount() : finalAmount;
                transaction.setTotalMoney(actualFinalAmountCOD.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán COD" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(actualFinalAmountCOD.setScale(2, RoundingMode.HALF_UP))
                        .build();
        }

        private PaymentResponseDTO processBankingPayment(Bill bill, BigDecimal finalAmount, boolean hasCustomerInfo) {
                LOGGER.info("Processing Banking payment for bill {} with amount {}", bill.getId(), finalAmount);
                LOGGER.info("Banking Payment - Current bill info: voucherCode={}, reductionAmount={}, finalAmount={}", 
                           bill.getVoucherCode(), bill.getReductionAmount(), bill.getFinalAmount());
                if (finalAmount.compareTo(new BigDecimal("999999999999999.99")) > 0) {
                        throw new RuntimeException("Số tiền vượt quá giới hạn cho phép");
                }

                bill.setType(PaymentType.BANKING);
                // Sử dụng finalAmount hiện tại của bill (đã tính voucher) thay vì parameter
                BigDecimal actualFinalAmount = bill.getFinalAmount() != null ? bill.getFinalAmount() : finalAmount;
                bill.setCustomerPayment(actualFinalAmount.setScale(2, RoundingMode.HALF_UP));
                // Không ghi đè finalAmount nếu đã có voucher được áp dụng
                if (bill.getFinalAmount() == null || bill.getFinalAmount().compareTo(ZERO) == 0) {
                        bill.setFinalAmount(finalAmount.setScale(2, RoundingMode.HALF_UP));
                } else {
                        LOGGER.info("Banking Payment - Keeping existing finalAmount with voucher: {}", bill.getFinalAmount());
                }
                bill.setStatus(hasCustomerInfo ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
                // new statuses
                bill.setPaymentStatus(PaymentStatus.PENDING);
                bill.setFulfillmentStatus(hasCustomerInfo ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy(getActor());
                Bill savedBill = billRepository.save(bill);

                List<BillDetail> billDetails = billDetailRepository.findByBillId(savedBill.getId());
                for (BillDetail billDetail : billDetails) {
                        billDetail.setStatus(BillDetailStatus.PAID);
                        if (bill.getStatus() == OrderStatus.PENDING) {
                                // typeOrder removed from BillDetail
                        }
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy(getActor());
                        billDetailRepository.save(billDetail);
                }

                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                // Sử dụng finalAmount thực tế từ bill (đã có voucher)
                BigDecimal actualFinalAmountBanking = savedBill.getFinalAmount() != null ? savedBill.getFinalAmount() : finalAmount;
                transaction.setTotalMoney(actualFinalAmountBanking.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán Banking" + (hasCustomerInfo ? " (xử lý như ONLINE)" : ""));
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                return PaymentResponseDTO.builder()
                        .bill(convertToBillResponseDTO(savedBill))
                        .paymentType(bill.getType())
                        .amount(actualFinalAmountBanking.setScale(2, RoundingMode.HALF_UP))
                        .build();
        }

        @Override
        @Transactional
        public String generateInvoice(Integer billId) {
                LOGGER.info("Generating invoice for bill {}", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // Allow printing invoice for any bill type and status

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

        /**
         * Map OrderStatus to corresponding BillDetailStatus
         */
        private BillDetailStatus mapOrderStatusToBillDetailStatus(OrderStatus orderStatus) {
                switch (orderStatus) {
                        case PENDING:
                        case CONFIRMING:
                        case CONFIRMED:
                                return BillDetailStatus.PENDING;
                        case PAID:
                                return BillDetailStatus.PAID;
                        case PACKED:
                                // Không thay đổi trạng thái chi tiết khi ĐÓNG GÓI
                                return null;
                        case DELIVERING:
                                // Không sử dụng trạng thái giao vận ở cấp chi tiết
                                return null;
                        case DELIVERED:
                        case COMPLETED:
                                // Không sử dụng "ĐÃ GIAO" ở cấp chi tiết; giữ nguyên (PAID cho đã thanh toán, PENDING cho COD)
                                return null;
                        case CANCELLED:
                                return BillDetailStatus.CANCELLED;
                        case RETURN_REQUESTED:
                        case RETURNED:
                        case REFUNDED:
                        case RETURN_COMPLETED:
                                return BillDetailStatus.RETURNED;
                        default:
                                LOGGER.warn("No mapping found for OrderStatus: {}", orderStatus);
                                return null;
                }
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
                        .paymentStatus(bill.getPaymentStatus()) // new
                        .fulfillmentStatus(bill.getFulfillmentStatus()) // new
                        .customerName(bill.getCustomerName())
                        .customerId(bill.getCustomer() != null ? bill.getCustomer().getId() : null)
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

                // Get bill details for this bill
                List<BillDetailResponseDTO> items = billDetailService.getAllBillDetailsByBillId(bill.getId());

                return BillResponseDTO.builder()
                        .id(bill.getId())
                        .code(bill.getCode())
                        .status(bill.getStatus())
                        .paymentStatus(bill.getPaymentStatus()) // new
                        .fulfillmentStatus(bill.getFulfillmentStatus()) // new
                        .customerName(bill.getCustomerName())
                        .customerId(bill.getCustomer() != null ? bill.getCustomer().getId() : null)
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
                        .items(items) // Add bill details items
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
                bill.setUpdatedBy(getActor());

                Bill savedBill = billRepository.save(bill);
                // Yêu cầu: Không tạo bản ghi lịch sử đơn hàng khi chỉ thêm thông tin khách hàng vào hóa đơn tại quầy
                // (Trước đây có tạo OrderHistory với action "Thêm khách hàng trung thành ... vào hóa đơn")
                LOGGER.debug("Skip creating OrderHistory for adding loyal customer to counter bill {} per new requirement", billId);

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
                // Không tạo tài khoản khách vãng lai; chỉ lưu thông tin trực tiếp trên bill
                bill.setCustomer(null);

                Bill savedBill = billRepository.save(bill);
                // Không tạo lịch sử khi thêm khách vãng lai (yêu cầu mới)
                LOGGER.debug("Skip creating OrderHistory for adding visiting guest to bill {}", billId);

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
                bill.setUpdatedBy(getActor());

                Bill savedBill = billRepository.save(bill);
                // Bỏ tạo lịch sử khi thêm user (khách) vào hóa đơn tại quầy
                LOGGER.debug("Skip creating OrderHistory for adding user {} to bill {}", user.getId(), billId);

                return convertToBillResponseDTO(savedBill);
        }

        @Override
        public void validateBillForDelivery(Integer billId) {
                LOGGER.info("Validating bill {} for delivery eligibility", billId);
                Bill bill = billRepository.findById(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
                // Allow delivery for either:
                // - Loyal customer (registered user linked to bill), or
                // - Visiting guest, when basic contact info is present on the bill
                if (bill.getCustomer() == null) {
                        boolean hasGuestInfo = bill.getCustomerName() != null && !bill.getCustomerName().trim().isEmpty()
                                        && bill.getPhoneNumber() != null && !bill.getPhoneNumber().trim().isEmpty();
                        if (!hasGuestInfo) {
                                throw new RuntimeException(
                                                "Hóa đơn phải có thông tin khách hàng (khách hàng trung thành hoặc vãng lai) để sử dụng chức năng giao hàng");
                        }
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
                bill.setPaymentStatus(PaymentStatus.PAID);
                if (bill.getFulfillmentStatus() == null || bill.getFulfillmentStatus() == FulfillmentStatus.PENDING) {
                        bill.setFulfillmentStatus(FulfillmentStatus.CONFIRMING);
                }
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy(getActor());

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
                        // typeOrder removed from BillDetail
                        billDetail.setUpdatedAt(Instant.now());
                        billDetail.setUpdatedBy(getActor());
                        billDetailRepository.save(billDetail);
                }

                // ⭐ Deduct inventory upon successful BANKING payment (for ONLINE bills only)
                if (bill.getBillType() == BillType.ONLINE) {
                        for (BillDetail detail : billDetails) {
                                ProductDetail productDetail = detail.getDetailProduct();
                                if (productDetail != null) {
                                        int available = productDetail.getQuantity();
                                        int need = detail.getQuantity();
                                        if (available < need) {
                                                throw new RuntimeException("Sản phẩm " + productDetail.getCode() +
                                                        " không đủ số lượng trong kho (còn " + available + ", cần " + need + ")");
                                        }
                                        productDetail.setQuantity(available - need);
                                        if (productDetail.getQuantity() <= 0) {
                                                productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
                                        }
                                        productDetailRepository.save(productDetail);
                                }
                        }
                        LOGGER.info("✅ Deducted inventory after BANKING payment confirm for ONLINE bill {}", billId);
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
                orderHistory.setCreatedBy(getActor());
                orderHistory.setUpdatedBy(getActor());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                Bill savedBill = billRepository.save(bill);

                // Send order confirmation email
                try {
                        if (savedBill.getCustomer() != null && savedBill.getCustomer().getEmail() != null) {
                                String to = savedBill.getCustomer().getEmail();
                                String userName = savedBill.getCustomer().getName();
                                String billCode = savedBill.getCode();
                                BigDecimal finalAmount = savedBill.getFinalAmount();
                                String address = savedBill.getAddress();
                                String phone = savedBill.getPhoneNumber();
                                String paymentMethod = savedBill.getType() != null ? savedBill.getType().name() : "BANKING";
                                emailService.sendOrderConfirmationEmail(to, userName, billCode, finalAmount, address, phone, paymentMethod);
                                LOGGER.info("📧 Sent order confirmation email to {} for bill {} (Banking)", to, billId);
                        } else {
                                LOGGER.warn("Skipping order confirmation email (Banking): missing customer or email for bill {}", billId);
                        }
                } catch (Exception emailEx) {
                        LOGGER.error("Failed to send order confirmation email (Banking) for bill {}: {}", billId, emailEx.getMessage());
                }

                return convertToBillResponseDTO(savedBill);
        }

        // helper mapping
        private FulfillmentStatus mapOrderStatusToFulfillment(OrderStatus status) {
        if (status == null) return null;
        switch (status) {
            case PENDING: return FulfillmentStatus.PENDING;
            case CONFIRMING: return FulfillmentStatus.CONFIRMING;
            case CONFIRMED: return FulfillmentStatus.CONFIRMED;
            case PACKED: return FulfillmentStatus.PACKED;
            case DELIVERING: return FulfillmentStatus.DELIVERING;
            case DELIVERED: return FulfillmentStatus.DELIVERED;
            case DELIVERY_FAILED: return FulfillmentStatus.DELIVERY_FAILED;
            case RETURN_REQUESTED: return FulfillmentStatus.RETURN_REQUESTED;
            case RETURNED: return FulfillmentStatus.RETURNED;
            case RETURN_COMPLETED: return FulfillmentStatus.RETURN_COMPLETED;
            case CANCELLED: return FulfillmentStatus.CANCELLED;
            case COMPLETED: return FulfillmentStatus.COMPLETED;
            default: return null; // For PAID/REFUNDED leave fulfillment as-is
        }
    }

    // Restore helpers lost during previous edits
    private BigDecimal calculateFinalAmount(Bill bill) {
        BigDecimal totalMoney = bill.getTotalMoney() != null ? bill.getTotalMoney() : ZERO;
        BigDecimal reductionAmount = bill.getReductionAmount() != null ? bill.getReductionAmount() : ZERO;
        BigDecimal moneyShip = bill.getMoneyShip() != null ? bill.getMoneyShip() : ZERO;
        return totalMoney.subtract(reductionAmount).add(moneyShip);
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

        /**
         * Deduct inventory for a COD order ensuring sufficient stock for every line.
         * If any product is short, throw 400 with remaining quantity message (Vietnamese, red toast on FE).
         */
        private void deductInventoryForCOD(Integer billId) {
                List<BillDetail> details = billDetailRepository.findByBillId(billId);
                // First pass: validate all
                for (BillDetail detail : details) {
                        ProductDetail pd = detail.getDetailProduct();
                        if (pd == null) continue;
                        int available = pd.getQuantity();
                        int required = detail.getQuantity();
                        if (available < required) {
                                String message = "Sản phẩm " + pd.getCode() + " không đủ số lượng. Còn: " + available + ", cần: " + required;
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
                        }
                }
                // Second pass: deduct
                for (BillDetail detail : details) {
                        ProductDetail pd = detail.getDetailProduct();
                        if (pd == null) continue;
                        int before = pd.getQuantity();
                        int newQty = before - detail.getQuantity();
                        pd.setQuantity(newQty);
                        if (newQty <= 0) {
                                pd.setStatus(ProductStatus.OUT_OF_STOCK);
                        }
                        productDetailRepository.save(pd);
                        LOGGER.info("🔄 Deducted {} ({} -> {}) for product {} in bill {}", detail.getQuantity(), before, newQty, pd.getCode(), billId);
                }
        }
}