package com.example.datnmainpolo.service.Impl.ReturnServiceImpl;

import com.example.datnmainpolo.dto.ReturnDTO.CreateReturnRequest;
import com.example.datnmainpolo.dto.ReturnDTO.ReturnResponseDTO;
import com.example.datnmainpolo.entity.*;
import com.example.datnmainpolo.enums.*;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.ReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnServiceImpl implements ReturnService {
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private final BillRepository billRepository;
    private final BillDetailRepository billDetailRepository;
    private final BillReturnRepository billReturnRepository;
    private final BillReturnItemRepository billReturnItemRepository;
    private final ProductDetailRepository productDetailRepository;
    private final TransactionRepository transactionRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final BillReturnAttachmentRepository billReturnAttachmentRepository;

    private String getActor() {
        try {
            String username = SecurityContextHolder.getContext() != null &&
                    SecurityContextHolder.getContext().getAuthentication() != null
                    ? SecurityContextHolder.getContext().getAuthentication().getName()
                    : null;
            if (username == null || "anonymousUser".equalsIgnoreCase(username)) return "system";
            return userRepository.findByEmail(username)
                    .map(u -> u.getName() != null ? u.getName() : username)
                    .orElse(username);
        } catch (Exception e) {
            return "system";
        }
    }

    @Override
    @Transactional
    public ReturnResponseDTO createReturn(Integer billId, CreateReturnRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

    boolean statusAllowed = Arrays.asList(OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.RETURNED, OrderStatus.RETURN_COMPLETED)
        .contains(bill.getStatus());
        if (!statusAllowed) {
            throw new RuntimeException("Không thể tạo yêu cầu trả hàng ở trạng thái hiện tại của hóa đơn");
        }

        // Guard: prevent creating a new return request if there is already one pending for this bill
        boolean hasPending = billReturnRepository.existsByBill_IdAndStatus(billId, ReturnStatus.REQUESTED);
        if (hasPending) {
            throw new RuntimeException("Đã có yêu cầu trả hàng đang chờ duyệt cho hóa đơn này. Vui lòng xử lý trước khi tạo yêu cầu mới.");
        }

    // Calculate already returned quantities per BillDetail, counting ONLY COMPLETED returns
    Map<Integer, Integer> returnedQtyMap = billReturnItemRepository
        .findByBillReturn_Bill_IdAndBillReturn_Status(billId, ReturnStatus.COMPLETED)
        .stream()
        .collect(Collectors.groupingBy(i -> i.getBillDetail().getId(), Collectors.summingInt(BillReturnItem::getQuantity)));

    List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
    // Safety: loại bỏ các dòng đã được đánh dấu RETURNED (đã duyệt phiếu trước đó)
    // để không tạo lại item trả cho các dòng đã tách/đã trả, tránh phát sinh dòng "Không có" và tính tiền trùng.
    billDetails = billDetails.stream()
        .filter(bd -> bd.getStatus() == null || bd.getStatus() != BillDetailStatus.RETURNED)
        .collect(Collectors.toList());
        Map<Integer, BillDetail> billDetailMap = billDetails.stream().collect(Collectors.toMap(BillDetail::getId, bd -> bd));

    BillReturn billReturn = new BillReturn();
    billReturn.setBill(bill);
    billReturn.setStatus(ReturnStatus.REQUESTED); // request first, admin will review
    billReturn.setReason(Optional.ofNullable(request.getReason()).orElse("Khách gửi yêu cầu trả hàng"));
    billReturn.setFullReturn(Boolean.TRUE.equals(request.getFullReturn()));
    billReturn.setCreatedAt(Instant.now());
    billReturn.setUpdatedAt(Instant.now());
    billReturn.setDeleted(false);

    List<BillReturnItem> items = new ArrayList<>();
    BigDecimal totalRefund = ZERO;

    // Data for voucher proration (apply discount proportionally by item share)
    BigDecimal billTotal = Optional.ofNullable(bill.getTotalMoney()).orElse(ZERO);
    BigDecimal billReduction = Optional.ofNullable(bill.getReductionAmount()).orElse(ZERO);
    boolean prorateDiscount = billReduction.compareTo(BigDecimal.ZERO) > 0 && billTotal.compareTo(BigDecimal.ZERO) > 0;

    if (Boolean.TRUE.equals(request.getFullReturn())) {
            for (BillDetail bd : billDetails) {
                int alreadyReturned = returnedQtyMap.getOrDefault(bd.getId(), 0);
                int canReturn = Math.max(0, bd.getQuantity() - alreadyReturned);
                if (canReturn <= 0) continue;
        BigDecimal unitPrice = bd.getPromotionalPrice() != null ? bd.getPromotionalPrice() : bd.getPrice();
        BigDecimal gross = unitPrice.multiply(BigDecimal.valueOf(canReturn));
        BigDecimal discountShare = prorateDiscount
            ? billReduction.multiply(gross.divide(billTotal, 8, RoundingMode.HALF_UP))
            : BigDecimal.ZERO;
        if (discountShare.compareTo(gross) > 0) discountShare = gross;
        BigDecimal refund = gross.subtract(discountShare).setScale(2, RoundingMode.HALF_UP);

                BillReturnItem item = new BillReturnItem();
                item.setBillReturn(billReturn);
                item.setBillDetail(bd);
                item.setQuantity(canReturn);
                item.setUnitPrice(unitPrice);
                item.setRefundAmount(refund);
                items.add(item);
                totalRefund = totalRefund.add(refund);
            }
        } else {
            if (request.getItems() == null || request.getItems().isEmpty()) {
                throw new RuntimeException("Danh sách sản phẩm trả không được để trống");
            }
            for (CreateReturnRequest.ReturnItem reqItem : request.getItems()) {
                BillDetail bd = billDetailMap.get(reqItem.getBillDetailId());
                if (bd == null) throw new RuntimeException("Không tìm thấy chi tiết hóa đơn: " + reqItem.getBillDetailId());
                // Không cho phép trả lại dòng đã đánh dấu RETURNED
                if (bd.getStatus() == BillDetailStatus.RETURNED) {
                    throw new RuntimeException("Sản phẩm đã được duyệt trả trước đó, không thể trả lại lần nữa (BillDetail #" + bd.getId() + ")");
                }
                int alreadyReturned = returnedQtyMap.getOrDefault(bd.getId(), 0);
                int remaining = bd.getQuantity() - alreadyReturned;
                if (reqItem.getQuantity() <= 0 || reqItem.getQuantity() > remaining) {
                    throw new RuntimeException("Số lượng trả không hợp lệ cho sản phẩm " + (bd.getDetailProduct() != null ? bd.getDetailProduct().getCode() : ("#"+bd.getId())));
                }
        BigDecimal unitPrice = bd.getPromotionalPrice() != null ? bd.getPromotionalPrice() : bd.getPrice();
        BigDecimal gross = unitPrice.multiply(BigDecimal.valueOf(reqItem.getQuantity()));
        BigDecimal discountShare = prorateDiscount
            ? billReduction.multiply(gross.divide(billTotal, 8, RoundingMode.HALF_UP))
            : BigDecimal.ZERO;
        if (discountShare.compareTo(gross) > 0) discountShare = gross;
        BigDecimal refund = gross.subtract(discountShare).setScale(2, RoundingMode.HALF_UP);

                BillReturnItem item = new BillReturnItem();
                item.setBillReturn(billReturn);
                item.setBillDetail(bd);
                item.setQuantity(reqItem.getQuantity());
                item.setUnitPrice(unitPrice);
                item.setRefundAmount(refund);
                items.add(item);
                totalRefund = totalRefund.add(refund);
            }
        }

        if (items.isEmpty()) {
            throw new RuntimeException("Không có sản phẩm nào hợp lệ để trả trong hóa đơn này");
        }

        billReturn.setItems(items);
        billReturn.setTotalRefundAmount(totalRefund);

        // Persist request first
        BillReturn saved = billReturnRepository.save(billReturn);
        billReturnItemRepository.saveAll(items);

        // Save attachments if provided
        if (request.getAttachmentUrls() != null) {
            for (String url : request.getAttachmentUrls()) {
                if (url == null || url.isBlank()) continue;
                BillReturnAttachment att = new BillReturnAttachment();
                att.setBillReturn(saved);
                att.setUrl(url);
                // naive content type guess
                att.setContentType(url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".mov") ? "video" : "image");
                billReturnAttachmentRepository.save(att);
            }
        }

        // Update bill to RETURN_REQUESTED for visibility
        bill.setStatus(OrderStatus.RETURN_REQUESTED);
        bill.setFulfillmentStatus(FulfillmentStatus.RETURN_REQUESTED);
        bill.setUpdatedAt(Instant.now());

        OrderHistory history = new OrderHistory();
        history.setBill(bill);
        history.setStatusOrder(OrderStatus.RETURN_REQUESTED);
    history.setActionDescription("Khách gửi yêu cầu trả hàng - tổng dự kiến hoàn (đã trừ voucher): " + totalRefund);
        history.setCreatedAt(Instant.now());
        history.setUpdatedAt(Instant.now());
        history.setCreatedBy(getActor());
        history.setUpdatedBy(getActor());
        history.setDeleted(false);
        orderHistoryRepository.save(history);

        billRepository.save(bill);

        return toDTO(saved);
    }

    @Override
    @Transactional
    public ReturnResponseDTO completeReturn(Integer returnId) {
        BillReturn billReturn = billReturnRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu trả hàng"));
        if (billReturn.getStatus() != ReturnStatus.APPROVED) {
            throw new RuntimeException("Chỉ được hoàn tất khi phiếu trả hàng đã được duyệt");
        }
        Bill bill = billReturn.getBill();
    // Tồn kho đã được cộng ngay khi DUYỆT để phản ánh nhanh tồn. Tại bước hoàn tất chỉ xử lý thanh toán.

        Transaction transaction = transactionRepository.findByBillId(bill.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        // Compute total refund (net of voucher proration) first
        BigDecimal totalRefund = billReturn.getTotalRefundAmount() != null ? billReturn.getTotalRefundAmount() : BigDecimal.ZERO;

        // Update transaction handling:
        // - If COD and transaction is still PENDING: reduce the amount due by the refund, do not cancel unless full return
        // - Otherwise mark REFUNDED with refund amount
        if (bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING) {
            BigDecimal currentDue = Optional.ofNullable(transaction.getTotalMoney()).orElse(ZERO);
            BigDecimal newDue = currentDue.subtract(totalRefund);
            if (newDue.compareTo(BigDecimal.ZERO) <= 0) {
                // Full return or refund covers all due -> cancel COD
                transaction.setTotalMoney(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.CANCELLED);
                transaction.setNote("Hoàn tất trả hàng COD - điều chỉnh công nợ, hủy đơn COD nếu hoàn toàn bộ");
            } else {
                // Partial return: reduce amount to collect on delivery
                transaction.setTotalMoney(newDue.setScale(2, RoundingMode.HALF_UP));
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Hoàn tất trả hàng COD - đã giảm số tiền phải thu khi giao hàng");
            }
        } else {
            transaction.setStatus(TransactionStatus.REFUNDED);
            transaction.setType(TransactionType.REFUND);
            transaction.setTotalMoney(totalRefund.setScale(2, RoundingMode.HALF_UP));
            transaction.setNote("Hoàn tất trả hàng - đã hoàn tiền cho khách hàng");
        }
        transaction.setUpdatedAt(Instant.now());
        transactionRepository.save(transaction);

    // Recalculate bill monetary fields based on remaining (non-RETURNED) items
        // Subtotal = sum of unit price x qty for items the customer keeps (exclude RETURNED lines)
        List<BillDetail> allDetails = billDetailRepository.findByBillId(bill.getId());
        BigDecimal newSubtotal = allDetails.stream()
                .filter(bd -> bd.getStatus() == null || bd.getStatus() != BillDetailStatus.RETURNED)
                .map(bd -> {
                    BigDecimal unit = bd.getPromotionalPrice() != null ? bd.getPromotionalPrice() : bd.getPrice();
                    int q = bd.getQuantity() != null ? bd.getQuantity() : 0;
                    return unit.multiply(BigDecimal.valueOf(q));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    boolean hasRemainingItems = newSubtotal.compareTo(BigDecimal.ZERO) > 0;

        // Keep the effective discount rate reff = originalReduction / originalSubtotal (if any)
        BigDecimal originalSubtotal = Optional.ofNullable(bill.getTotalMoney()).orElse(ZERO);
        BigDecimal originalReduction = Optional.ofNullable(bill.getReductionAmount()).orElse(ZERO);
        BigDecimal newReduction = BigDecimal.ZERO;
        if (originalSubtotal.compareTo(BigDecimal.ZERO) > 0 && originalReduction.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal reff = originalReduction.divide(originalSubtotal, 8, RoundingMode.HALF_UP);
            newReduction = newSubtotal.multiply(reff).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal moneyShip = Optional.ofNullable(bill.getMoneyShip()).orElse(ZERO);
        BigDecimal newFinal = newSubtotal.subtract(newReduction).add(moneyShip).setScale(2, RoundingMode.HALF_UP);

        bill.setTotalMoney(newSubtotal);
        bill.setReductionAmount(newReduction);
    bill.setFinalAmount(newFinal);

    // Cập nhật lại số tiền khách trả theo yêu cầu nghiệp vụ:
    // - Nếu hoàn toàn bộ hàng: khách chỉ trả phí ship
    // - Nếu hoàn 1 phần: khách trả số tiền còn lại của đơn + phí ship
    BigDecimal updatedCustomerPayment = Boolean.TRUE.equals(billReturn.getFullReturn())
        ? moneyShip
        : newFinal;
    bill.setCustomerPayment(updatedCustomerPayment);

        // Restore voucher if full return and bill used a voucher
        if (Boolean.TRUE.equals(billReturn.getFullReturn()) && bill.getVoucherCode() != null) {
            voucherRepository.findByCodeAndDeletedFalse(bill.getVoucherCode()).ifPresent(v -> {
                v.setQuantity(v.getQuantity() + 1);
                if (v.getStatus() == PromotionStatus.USED_UP) {
                    v.setStatus(PromotionStatus.ACTIVE);
                }
                voucherRepository.save(v);
            });
        }

        // Trạng thái sau khi hoàn tất trả hàng:
        // - Nếu còn sản phẩm trong đơn: cho phép tiếp tục luồng trạng thái
        //   + COD chưa thu tiền: để ở trạng thái ĐÃ GIAO (DELIVERED) để tiếp tục thu tiền
        //   + Đã thanh toán (VNPAY/đã thu COD): chuyển về HOÀN THÀNH (COMPLETED) để thống kê
        // - Nếu trả toàn bộ (không còn sản phẩm): giữ HOÀN TRẢ HOÀN TẤT
        if (hasRemainingItems) {
            if (bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING) {
                bill.setStatus(OrderStatus.DELIVERED);
                bill.setFulfillmentStatus(FulfillmentStatus.DELIVERED);
            } else {
                bill.setStatus(OrderStatus.COMPLETED);
                bill.setFulfillmentStatus(FulfillmentStatus.COMPLETED);
            }
        } else {
            bill.setStatus(OrderStatus.RETURN_COMPLETED);
            bill.setFulfillmentStatus(FulfillmentStatus.RETURN_COMPLETED);
        }

        // Cập nhật PaymentStatus sau hoàn trả
        if (bill.getType() == PaymentType.COD && transaction.getStatus() == TransactionStatus.PENDING) {
            // COD chưa thu tiền: giữ trạng thái chưa thanh toán
            bill.setPaymentStatus(PaymentStatus.UNPAID);
        } else {
            if (Boolean.TRUE.equals(billReturn.getFullReturn())) {
                // Hoàn toàn bộ: nếu còn phí ship thì coi là hoàn 1 phần, ngược lại hoàn toàn
                if (moneyShip.compareTo(BigDecimal.ZERO) > 0) {
                    bill.setPaymentStatus(PaymentStatus.PARTIALLY_REFUNDED);
                } else {
                    bill.setPaymentStatus(PaymentStatus.REFUNDED);
                }
            } else {
                bill.setPaymentStatus(PaymentStatus.PARTIALLY_REFUNDED);
            }
        }

        bill.setUpdatedAt(Instant.now());

        OrderHistory history = new OrderHistory();
        history.setBill(bill);
        history.setStatusOrder(OrderStatus.RETURN_COMPLETED);
        String nextFlowNote;
        if (hasRemainingItems) {
            if (bill.getStatus() == OrderStatus.COMPLETED) {
                nextFlowNote = " | chuyển trạng thái: ĐÃ HOÀN THÀNH";
            } else {
                nextFlowNote = " | chuyển trạng thái: ĐÃ GIAO - chờ thanh toán";
            }
        } else {
            nextFlowNote = " | giữ trạng thái: HOÀN TRẢ HOÀN TẤT";
        }
        history.setActionDescription("Hoàn tất trả hàng - Đồng bộ thanh toán (hoàn: " + totalRefund + ")" + nextFlowNote);
        history.setCreatedAt(Instant.now());
        history.setUpdatedAt(Instant.now());
        history.setCreatedBy(getActor());
        history.setUpdatedBy(getActor());
        history.setDeleted(false);
        orderHistoryRepository.save(history);

        billRepository.save(bill);

        return toDTO(billReturn);
    }

    @Override
    @Transactional
    public ReturnResponseDTO approveReturn(Integer returnId) {
        BillReturn br = billReturnRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu trả hàng"));
        if (br.getStatus() != ReturnStatus.REQUESTED) {
            throw new RuntimeException("Chỉ có thể duyệt yêu cầu trả hàng đang ở trạng thái CHỜ DUYỆT");
        }
        br.setStatus(ReturnStatus.APPROVED);
        br.setUpdatedAt(Instant.now());
        billReturnRepository.save(br);

        // Cập nhật từng dòng sản phẩm: nếu trả 1 phần thì tách dòng
        List<BillReturnItem> approvedItems = billReturnItemRepository.findByBillReturn_Id(br.getId());
        for (BillReturnItem item : approvedItems) {
            BillDetail bd = item.getBillDetail();
            if (bd == null) continue;

            int lineQty = bd.getQuantity() != null ? bd.getQuantity() : 0;
            int retQty = item.getQuantity();
            if (retQty >= lineQty) {
                // Trả toàn bộ dòng
                bd.setStatus(BillDetailStatus.RETURNED);
                billDetailRepository.save(bd);
                // item vẫn trỏ tới bd hiện tại

                // Cộng lại tồn kho ngay khi duyệt
                ProductDetail pd = bd.getDetailProduct();
                pd.setQuantity(pd.getQuantity() + retQty);
                if (pd.getQuantity() > 0) pd.setStatus(ProductStatus.AVAILABLE);
                productDetailRepository.save(pd);
            } else if (retQty > 0) {
                // Tách dòng: giảm số lượng dòng gốc, tạo dòng mới trạng thái RETURNED
                bd.setQuantity(lineQty - retQty);
                billDetailRepository.save(bd);

                BillDetail returnedLine = new BillDetail();
                returnedLine.setBill(bd.getBill());
                returnedLine.setDetailProduct(bd.getDetailProduct());
                returnedLine.setQuantity(retQty);
                returnedLine.setPrice(bd.getPrice());
                returnedLine.setPromotionalPrice(bd.getPromotionalPrice());
                returnedLine.setStatus(BillDetailStatus.RETURNED);
                returnedLine.setCreatedAt(Instant.now());
                returnedLine.setUpdatedAt(Instant.now());
                returnedLine.setCreatedBy(getActor());
                returnedLine.setUpdatedBy(getActor());
                returnedLine.setDeleted(Boolean.FALSE);
                BillDetail savedReturned = billDetailRepository.save(returnedLine);

                // Gắn lại item sang dòng đã tách để quy trình hoàn tất/hoàn kho xử lý đúng
                item.setBillDetail(savedReturned);
                billReturnItemRepository.save(item);

                // Cộng lại tồn kho ngay khi duyệt cho phần tách trả
                ProductDetail pd = savedReturned.getDetailProduct();
                pd.setQuantity(pd.getQuantity() + retQty);
                if (pd.getQuantity() > 0) pd.setStatus(ProductStatus.AVAILABLE);
                productDetailRepository.save(pd);
            }
        }

        Bill bill = br.getBill();
        // Recalculate monetary summary right after approval based on remaining (non-RETURNED) items
        List<BillDetail> currentDetails = billDetailRepository.findByBillId(bill.getId());
        BigDecimal subtotalAfterApproval = currentDetails.stream()
                .filter(bd -> bd.getStatus() == null || bd.getStatus() != BillDetailStatus.RETURNED)
                .map(bd -> {
                    BigDecimal unit = bd.getPromotionalPrice() != null ? bd.getPromotionalPrice() : bd.getPrice();
                    int q = bd.getQuantity() != null ? bd.getQuantity() : 0;
                    return unit.multiply(BigDecimal.valueOf(q));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal originalSubtotal2 = Optional.ofNullable(bill.getTotalMoney()).orElse(ZERO);
        BigDecimal originalReduction2 = Optional.ofNullable(bill.getReductionAmount()).orElse(ZERO);
        BigDecimal newReduction2 = BigDecimal.ZERO;
        if (originalSubtotal2.compareTo(BigDecimal.ZERO) > 0 && originalReduction2.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal reff2 = originalReduction2.divide(originalSubtotal2, 8, RoundingMode.HALF_UP);
            newReduction2 = subtotalAfterApproval.multiply(reff2).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal ship2 = Optional.ofNullable(bill.getMoneyShip()).orElse(ZERO);
        BigDecimal finalAfterApproval = subtotalAfterApproval.subtract(newReduction2).add(ship2).setScale(2, RoundingMode.HALF_UP);

        bill.setTotalMoney(subtotalAfterApproval);
        bill.setReductionAmount(newReduction2);
        bill.setFinalAmount(finalAfterApproval);
        bill.setStatus(OrderStatus.RETURNED);
        bill.setFulfillmentStatus(FulfillmentStatus.RETURNED);
        bill.setUpdatedAt(Instant.now());
        billRepository.save(bill);

        OrderHistory history = new OrderHistory();
        history.setBill(bill);
        history.setStatusOrder(OrderStatus.RETURNED);
        history.setActionDescription("Admin đã duyệt yêu cầu trả hàng");
        history.setCreatedAt(Instant.now());
        history.setUpdatedAt(Instant.now());
        history.setCreatedBy(getActor());
        history.setUpdatedBy(getActor());
        history.setDeleted(false);
        orderHistoryRepository.save(history);

        return toDTO(br);
    }

    @Override
    @Transactional
    public ReturnResponseDTO rejectReturn(Integer returnId, String reason) {
        BillReturn br = billReturnRepository.findById(returnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu trả hàng"));
        if (br.getStatus() != ReturnStatus.REQUESTED) {
            throw new RuntimeException("Chỉ có thể từ chối yêu cầu trả hàng đang ở trạng thái CHỜ DUYỆT");
        }
        br.setStatus(ReturnStatus.REJECTED);
        if (reason != null && !reason.isBlank()) {
            br.setReason(reason);
        }
        br.setUpdatedAt(Instant.now());
        billReturnRepository.save(br);

    Bill bill = br.getBill();
    // Revert bill status back to DELIVERED (business rule); this unblocks future returns
        bill.setStatus(OrderStatus.DELIVERED);
        bill.setFulfillmentStatus(FulfillmentStatus.DELIVERED);
        bill.setUpdatedAt(Instant.now());
        billRepository.save(bill);

        OrderHistory history = new OrderHistory();
        history.setBill(bill);
        history.setStatusOrder(OrderStatus.DELIVERED);
        history.setActionDescription("Admin từ chối yêu cầu trả hàng" + (reason != null ? (": " + reason) : ""));
        history.setCreatedAt(Instant.now());
        history.setUpdatedAt(Instant.now());
        history.setCreatedBy(getActor());
        history.setUpdatedBy(getActor());
        history.setDeleted(false);
        orderHistoryRepository.save(history);

        return toDTO(br);
    }

    @Override
    public List<ReturnResponseDTO> getReturnsByBill(Integer billId) {
        List<BillReturn> list = billReturnRepository.findByBill_Id(billId);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private ReturnResponseDTO toDTO(BillReturn br) {
        return ReturnResponseDTO.builder()
                .id(br.getId())
                .billId(br.getBill().getId())
                .status(br.getStatus().name())
                .reason(br.getReason())
                .fullReturn(Boolean.TRUE.equals(br.getFullReturn()))
                .totalRefundAmount(br.getTotalRefundAmount())
                .createdAt(br.getCreatedAt())
                .items(br.getItems().stream().map(i -> ReturnResponseDTO.Item.builder()
                        .id(i.getId())
                        .billDetailId(i.getBillDetail().getId())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .refundAmount(i.getRefundAmount())
                        .build()).collect(Collectors.toList()))
                .attachments(Optional.ofNullable(br.getAttachments()).orElse(Collections.emptyList())
                        .stream().map(a -> a.getUrl()).collect(Collectors.toList()))
                .build();
    }
}
