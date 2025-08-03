package com.example.datnmainpolo.service.Impl.BillServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.DeliveryBillAddressRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryResponseDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.entity.OrderHistory;
import com.example.datnmainpolo.entity.Transaction;
import com.example.datnmainpolo.enums.BillType;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.enums.TransactionStatus;
import com.example.datnmainpolo.enums.TransactionType;
import com.example.datnmainpolo.repository.BillDetailRepository;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.CustomerInformationRepository;
import com.example.datnmainpolo.repository.OrderHistoryRepository;
import com.example.datnmainpolo.repository.TransactionRepository;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.OnlineOrderConfirmationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OnlineOrderConfirmationServiceImpl implements OnlineOrderConfirmationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(OnlineOrderConfirmationServiceImpl.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final BillRepository billRepository;
    private final BillDetailRepository billDetailRepository;
    private final BillService billService;
    private final BillDetailService billDetailService;
    private final OrderHistoryRepository orderHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final DeliveryBillService deliveryBillService;
    private final CustomerInformationRepository customerInformationRepository;

    @Override
    @Transactional
    public BillResponseDTO confirmOrder(Integer billId) {
        LOGGER.info("Confirming order for bill {}", billId);
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getBillType() != BillType.ONLINE) {
            throw new RuntimeException("Chỉ có thể xác nhận đơn hàng ONLINE");
        }

        if (bill.getStatus() != OrderStatus.PAID && bill.getType() != PaymentType.COD) {
            throw new RuntimeException("Hóa đơn phải ở trạng thái PAID hoặc sử dụng COD để xác nhận");
        }

        bill.setStatus(OrderStatus.CONFIRMING);
        bill.setConfirmationDate(Instant.now());
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billDetailService.updateBillDetailTypeOrder(billId, OrderStatus.CONFIRMING);

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(OrderStatus.CONFIRMING);
        orderHistory.setActionDescription("Xác nhận đơn hàng online");
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        Bill savedBill = billRepository.save(bill);
        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    @Transactional
    public BillResponseDTO addProductToConfirmingOrder(Integer billId, BillDetailCreateDTO request) {
        LOGGER.info("Adding product to confirming order for bill {}", billId);
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getStatus() != OrderStatus.CONFIRMING) {
            throw new RuntimeException("Chỉ có thể thêm sản phẩm khi hóa đơn ở trạng thái CONFIRMING");
        }
        BillDetailResponseDTO billDetailResponse = billDetailService.createBillDetail(billId, request);


        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(OrderStatus.CONFIRMING);
        orderHistory.setActionDescription("Thêm sản phẩm (ID: " + request.getProductDetailId() + ", Số lượng: " + request.getQuantity() + ") vào đơn hàng");
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        billService.applyBestPublicVoucher(bill);
        Bill savedBill = billRepository.save(bill);
        return billService.convertToBillResponseDTO2(savedBill);
    }



    @Override
    @Transactional
    public void removeProductFromConfirmingOrder(Integer billDetailId) {
        LOGGER.info("Removing product from confirming order, bill detail {}", billDetailId);
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        Bill bill = billDetail.getBill();
        if (bill.getStatus() != OrderStatus.CONFIRMING) {
            throw new RuntimeException("Chỉ có thể xóa sản phẩm khi hóa đơn ở trạng thái CONFIRMING");
        }

        billDetailService.deleteBillDetail(billDetailId);

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(OrderStatus.CONFIRMING);
        orderHistory.setActionDescription("Xóa sản phẩm (ID: " + billDetail.getDetailProduct().getId() + ", Số lượng: " + billDetail.getQuantity() + ") khỏi đơn hàng");
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        billService.applyBestPublicVoucher(bill);
        billRepository.save(bill);
    }

    @Override
    @Transactional
    public BillResponseDTO updateOrderStatus(Integer billId, OrderStatus newStatus) {
        LOGGER.info("Updating order status for bill {} to {}", billId, newStatus);
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getBillType() != BillType.ONLINE) {
            throw new RuntimeException("Chỉ có thể cập nhật trạng thái cho đơn hàng ONLINE");
        }

        if (newStatus == OrderStatus.PAID) {
            if (bill.getCustomerPayment() == null || bill.getCustomerPayment().compareTo(bill.getTotalMoney()) < 0) {
                throw new RuntimeException("Số tiền khách trả phải lớn hơn hoặc bằng tổng tiền hóa đơn để cập nhật trạng thái PAID");
            }
        }



        // Update BillDetail typeOrder using the service method
        billDetailService.updateBillDetailTypeOrder(billId, newStatus);

        if (newStatus == OrderStatus.COMPLETED) {
            bill.setCompletionDate(Instant.now());
            if (bill.getType() == PaymentType.COD) {
                Transaction transaction = transactionRepository.findByBillId(billId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Thanh toán COD hoàn tất");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);
            }
        } else if (newStatus == OrderStatus.DELIVERING) {
            bill.setDeliveryDate(Instant.now());
        } else if (newStatus == OrderStatus.PAID) {
            bill.setConfirmationDate(Instant.now());
        }

        bill.setStatus(newStatus);
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(newStatus);
        orderHistory.setActionDescription("Cập nhật trạng thái đơn hàng sang " + newStatus);
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        Bill savedBill = billRepository.save(bill);
        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    @Transactional
    public BillResponseDTO updateCODPaymentAmount(Integer billId, BigDecimal amount) {
        LOGGER.info("Updating COD payment amount for bill {} to {}", billId, amount);
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getBillType() != BillType.ONLINE || bill.getType() != PaymentType.COD) {
            throw new RuntimeException("Chỉ có thể cập nhật số tiền thanh toán cho đơn hàng ONLINE với phương thức COD");
        }

        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new RuntimeException("Số tiền thanh toán không hợp lệ");
        }

        if (amount.compareTo(bill.getFinalAmount()) < 0) {
            throw new RuntimeException("Số tiền thanh toán COD phải lớn hơn hoặc bằng số tiền cuối cùng của hóa đơn");
        }

        Transaction transaction = transactionRepository.findByBillId(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
        transaction.setTotalMoney(amount.setScale(2, RoundingMode.HALF_UP));
        transaction.setUpdatedAt(Instant.now());
        transaction.setNote("Cập nhật số tiền thanh toán COD");

        transactionRepository.save(transaction);

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(bill.getStatus());
        orderHistory.setActionDescription("Cập nhật số tiền thanh toán COD: " + amount);
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        Bill savedBill = billRepository.save(bill);
        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    @Transactional
    public BillResponseDTO updateCustomerPayment(Integer billId, BigDecimal amount) {
        LOGGER.info("Updating customer payment for bill {} to {}", billId, amount);
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (amount == null || amount.compareTo(ZERO) <= 0) {
            throw new RuntimeException("Số tiền khách trả không hợp lệ");
        }

        bill.setCustomerPayment(amount.setScale(2, RoundingMode.HALF_UP));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(bill.getStatus());
        orderHistory.setActionDescription("Cập nhật số tiền khách trả: " + amount);
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        Bill savedBill = billRepository.save(bill);
        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    @Transactional
    public BillResponseDTO updateBillAddress(Integer billId, DeliveryBillAddressRequestDTO request) {
        LOGGER.info("Updating address for bill {}", billId);
        if (request.getBillId() == null || !request.getBillId().equals(billId)) {
            throw new RuntimeException("billId trong request không khớp với path variable");
        }
        if (request.getProvinceId() == null || request.getDistrictId() == null || request.getWardCode() == null) {
            throw new RuntimeException("Thông tin địa chỉ (provinceId, districtId, wardCode) không được để trống");
        }
        if (request.getCustomerName() == null || request.getPhoneNumber() == null || request.getAddressDetail() == null) {
            throw new RuntimeException("Thông tin khách hàng (customerName, phoneNumber, addressDetail) không được để trống");
        }

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getBillType() != BillType.ONLINE) {
            throw new RuntimeException("Chỉ có thể cập nhật địa chỉ cho đơn hàng ONLINE");
        }
        if (bill.getStatus() != OrderStatus.PENDING && bill.getStatus() != OrderStatus.CONFIRMING) {
            throw new RuntimeException("Chỉ có thể cập nhật địa chỉ khi hóa đơn ở trạng thái PENDING hoặc CONFIRMING");
        }

        CustomerInformation customerInfo = bill.getCustomerInfor() != null ? bill.getCustomerInfor() : new CustomerInformation();
        if (bill.getCustomerInfor() == null) {
            customerInfo.setCreatedAt(Instant.now());
            customerInfo.setDeleted(false);
            customerInfo.setCustomer(bill.getCustomer());
        }

        customerInfo.setName(request.getCustomerName());
        customerInfo.setPhoneNumber(request.getPhoneNumber());
        customerInfo.setProvinceId(request.getProvinceId());
        customerInfo.setDistrictId(request.getDistrictId());
        customerInfo.setWardCode(request.getWardCode());
        customerInfo.setAddress(request.getAddressDetail());
        customerInfo.setUpdatedAt(Instant.now());

        deliveryBillService.updateCustomerAddressFromGHN(customerInfo);
        customerInfo = customerInformationRepository.save(customerInfo);

        BigDecimal shippingFee = deliveryBillService.calculateShippingFee(customerInfo);

        bill.setCustomerInfor(customerInfo);
        bill.setCustomerName(customerInfo.getName());
        bill.setPhoneNumber(customerInfo.getPhoneNumber());
        bill.setAddress(String.format("%s, %s, %s, %s",
                customerInfo.getAddress(),
                customerInfo.getWardName() != null ? customerInfo.getWardName() : "",
                customerInfo.getDistrictName() != null ? customerInfo.getDistrictName() : "",
                customerInfo.getProvinceName() != null ? customerInfo.getProvinceName() : ""));
        bill.setMoneyShip(shippingFee);
        bill.setDesiredDate(request.getDesiredDate() != null ? request.getDesiredDate() : Instant.now());
        bill.setFinalAmount(bill.getTotalMoney().subtract(bill.getReductionAmount()).add(shippingFee));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");

        // Don't apply public voucher automatically - let user choose in frontend
        // billService.applyBestPublicVoucher(bill);

        Bill savedBill = billRepository.save(bill);

        Transaction transaction = transactionRepository.findByBillId(billId)
                .orElseGet(() -> {
                    Transaction newTransaction = new Transaction();
                    newTransaction.setBill(savedBill);
                    newTransaction.setType(TransactionType.PAYMENT);
                    newTransaction.setStatus(TransactionStatus.PENDING);
                    newTransaction.setCreatedAt(Instant.now());
                    newTransaction.setDeleted(false);
                    return newTransaction;
                });
        transaction.setTotalMoney(savedBill.getFinalAmount());
        transaction.setNote("Cập nhật giao dịch với phí ship mới sau khi thay đổi địa chỉ");
        transaction.setUpdatedAt(Instant.now());

        transactionRepository.save(transaction);

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(savedBill);
        orderHistory.setStatusOrder(bill.getStatus());
        orderHistory.setActionDescription(String.format("Cập nhật địa chỉ giao hàng: %s, Phí ship: %s", bill.getAddress(), shippingFee));
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    @Transactional
    public BillResponseDTO revertOrderStatus(Integer billId) {
        LOGGER.info("Reverting order status for bill {}", billId);
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getBillType() != BillType.ONLINE) {
            throw new RuntimeException("Chỉ có thể quay lại trạng thái cho đơn hàng ONLINE");
        }

        if (bill.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Không thể quay lại trạng thái từ COMPLETED");
        }

        List<OrderHistory> historyList = orderHistoryRepository.findByBillIdAndDeletedFalseOrderByCreatedAtDesc(billId);
        if (historyList.size() < 2) {
            throw new RuntimeException("Không có trạng thái trước đó để quay lại");
        }

        OrderStatus previousStatus = historyList.get(1).getStatusOrder();
        if (!isValidStatusTransition(bill.getStatus(), previousStatus)) {
            throw new RuntimeException("Không thể quay lại trạng thái " + previousStatus);
        }

        bill.setStatus(previousStatus);
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billDetailService.updateBillDetailTypeOrder(billId, previousStatus);

        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(previousStatus);
        orderHistory.setActionDescription("Quay lại trạng thái " + previousStatus);
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        Bill savedBill = billRepository.save(bill);
        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    public List<OrderHistoryResponseDTO> getOrderHistory(Integer billId) {
        LOGGER.info("Fetching order history for bill {}", billId);
        List<OrderHistory> historyList = orderHistoryRepository.findByBillIdAndDeletedFalseOrderByCreatedAtDesc(billId);
        return historyList.stream()
                .map(this::convertToOrderHistoryResponseDTO)
                .collect(Collectors.toList());
    }

    private boolean isValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        switch (currentStatus) {
            case PENDING:
                return newStatus == OrderStatus.CONFIRMING || newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.PAID;
            case CONFIRMING:
                return newStatus == OrderStatus.DELIVERING || newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.PAID;
            case DELIVERING:
                return newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.RETURNED || newStatus == OrderStatus.CONFIRMING;
            case COMPLETED:
                return newStatus == OrderStatus.RETURNED;
            case RETURNED:
                return newStatus == OrderStatus.REFUNDED || newStatus == OrderStatus.RETURN_COMPLETED;
            default:
                return false;
        }
    }

    private OrderHistoryResponseDTO convertToOrderHistoryResponseDTO(OrderHistory orderHistory) {
        return OrderHistoryResponseDTO.builder()
                .id(orderHistory.getId())
                .billId(orderHistory.getBill().getId())
                .statusOrder(orderHistory.getStatusOrder())
                .actionDescription(orderHistory.getActionDescription())
                .createdAt(orderHistory.getCreatedAt())
                .createdBy(orderHistory.getCreatedBy())
                .updatedAt(orderHistory.getUpdatedAt())
                .updatedBy(orderHistory.getUpdatedBy())
                .build();
    }
}