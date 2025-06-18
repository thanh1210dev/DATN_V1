package com.example.datnmainpolo.service.Impl.BillServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.OrderHistory;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.entity.Transaction;
import com.example.datnmainpolo.entity.Voucher;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.enums.ProductStatus;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.enums.TransactionStatus;
import com.example.datnmainpolo.enums.TransactionType;
import com.example.datnmainpolo.enums.VoucherType;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.OrderHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {
        private final BillRepository billRepository;
        private final UserRepository userRepository;
        private final CustomerInformationRepository customerInformationRepository;
        private final BillDetailRepository billDetailRepository;
        private final VoucherRepository voucherRepository;
        private final OrderHistoryService orderHistoryService;
        private final TransactionRepository transactionRepository;
        private final ProductDetailRepository productDetailRepository;
        private final OrderHistoryRepository orderHistoryRepository;

        @Override
        @Transactional
        public BillResponseDTO counterSale() {
                // Lấy thông tin người dùng từ SecurityContextHolder
                // Authentication authentication =
                // SecurityContextHolder.getContext().getAuthentication();
                // String email = authentication.getName();

                // Tìm user theo email
                // UserEntity employee = userRepository.findByEmail(email)
                // .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người
                // dùng"));

                // Kiểm tra quyền tạo hóa đơn
                // if (employee.getRole() != Role.STAFF && employee.getRole() != Role.ADMIN) {
                // throw new RuntimeException("Bạn không có quyền tạo hóa đơn. Chỉ nhân viên và
                // admin mới có quyền này.");
                // }
                UserEntity employee = userRepository.findById(1)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người dùng"));

                // Tạo Bill
                Bill bill = new Bill();
                bill.setCode("BILL" + System.currentTimeMillis());
                bill.setStatus(OrderStatus.PENDING);
                bill.setCreatedAt(Instant.now());
                bill.setUpdatedAt(Instant.now());
                bill.setCreatedBy(employee.getName());
                bill.setUpdatedBy(employee.getName());
                bill.setDeleted(false);
                bill.setEmployee(employee);
                bill.setTotalMoney(BigDecimal.ZERO);
                bill.setMoneyShip(BigDecimal.ZERO);
                bill.setReductionAmount(BigDecimal.ZERO);

                // Lưu bill
                Bill savedBill = billRepository.save(bill);

                // Tạo OrderHistory
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(savedBill);
                orderHistory.setStatusOrder(OrderStatus.PENDING);
                orderHistory.setActionDescription("Tạo hóa đơn mới");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(employee.getName());
                orderHistory.setUpdatedBy(employee.getName());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                // Tạo Transaction
                Transaction transaction = new Transaction();
                transaction.setBill(savedBill);
                transaction.setType(TransactionType.PAYMENT); // Mặc định là thanh toán
                transaction.setTotalMoney(BigDecimal.ZERO); // Số tiền ban đầu là 0
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Khởi tạo giao dịch");
                transaction.setCreatedAt(Instant.now());
                transaction.setUpdatedAt(Instant.now());
                transaction.setDeleted(false);
                transactionRepository.save(transaction);

                // Trả response
                return BillResponseDTO.builder()
                                .id(savedBill.getId())
                                .code(savedBill.getCode())
                                .status(savedBill.getStatus())
                                .totalMoney(savedBill.getTotalMoney())
                                .moneyShip(savedBill.getMoneyShip())
                                .reductionAmount(savedBill.getReductionAmount())
                                .finalAmount(BigDecimal.ZERO)
                                .createdAt(savedBill.getCreatedAt())
                                .employeeName(savedBill.getEmployee() != null ? savedBill.getEmployee().getName()
                                                : null)
                                .createdBy(savedBill.getCreatedBy())
                                .updatedBy(savedBill.getUpdatedBy())
                                .build();
        }

        @Override
        public PaginationResponse<BillResponseDTO> searchBills(String code, OrderStatus status, int page, int size) {
                // Tạo Pageable
                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                Sort.by("createdAt").descending());

                // Tìm kiếm bills
                Page<Bill> pageData = billRepository.findByCodeOrStatus(
                                code,
                                status,
                                pageable);

                // Chuyển đổi sang DTO
                Page<BillResponseDTO> dtoPage = pageData.map(bill -> BillResponseDTO.builder()
                                .id(bill.getId())
                                .code(bill.getCode())
                                .status(bill.getStatus())
                                .customerName(bill.getCustomerName())
                                .phoneNumber(bill.getPhoneNumber())
                                .address(bill.getAddress())
                                .totalMoney(bill.getTotalMoney())
                                .reductionAmount(bill.getReductionAmount())
                                .moneyShip(bill.getMoneyShip())
                                .finalAmount(
                                                (bill.getTotalMoney() != null ? bill.getTotalMoney() : BigDecimal.ZERO)
                                                                .subtract(bill.getReductionAmount() != null
                                                                                ? bill.getReductionAmount()
                                                                                : BigDecimal.ZERO)
                                                                .add(bill.getMoneyShip() != null ? bill.getMoneyShip()
                                                                                : BigDecimal.ZERO))
                                .createdAt(bill.getCreatedAt())
                                .employeeName(bill.getEmployee() != null ? bill.getEmployee().getName() : null)
                                .type(bill.getType())
                                .createdBy(bill.getCreatedBy())
                                .updatedBy(bill.getUpdatedBy())
                                .build());

                return new PaginationResponse<>(dtoPage);
        }

        @Override
        @Transactional
        public BillResponseDTO updateBillStatus(Integer billId, OrderStatus newStatus) {
                // 1. Kiểm tra bill
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // 2. Kiểm tra trạng thái hiện tại
                OrderStatus currentStatus = bill.getStatus();

                // 3. Cập nhật trạng thái bill
                bill.setStatus(newStatus);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system"); // hoặc lấy từ user đang đăng nhập

                // 4. Tạo OrderHistory mới
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(newStatus);
                orderHistory.setActionDescription("Cập nhật trạng thái từ " + currentStatus + " sang " + newStatus);
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(bill.getUpdatedBy());
                orderHistory.setUpdatedBy(bill.getUpdatedBy());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                // 5. Cập nhật Transaction nếu cần
                Transaction transaction = transactionRepository.findByBillId(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

                switch (newStatus) {
                        case PAID:
                                // Khi đơn hàng chuyển sang trạng thái đã thanh toán
                                transaction.setStatus(TransactionStatus.SUCCESS);
                                transaction.setNote("Thanh toán thành công");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;

                        case CANCELLED:
                                // Khi hủy đơn hàng
                                transaction.setStatus(TransactionStatus.CANCELLED);
                                transaction.setNote("Hủy đơn hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;

                        case REFUNDED:
                                // Khi hoàn tiền
                                transaction.setStatus(TransactionStatus.REFUNDED);
                                transaction.setNote("Hoàn tiền cho khách hàng");
                                transaction.setUpdatedAt(Instant.now());
                                transactionRepository.save(transaction);
                                break;

                        case COMPLETED:
                                // Khi hoàn thành đơn hàng
                                if (transaction.getStatus() != TransactionStatus.SUCCESS) {
                                        throw new RuntimeException("Không thể hoàn thành đơn hàng chưa thanh toán");
                                }
                                break;

                        case RETURNED:
                        case RETURN_COMPLETED:
                                // Khi trả hàng
                                if (transaction.getStatus() != TransactionStatus.SUCCESS) {
                                        throw new RuntimeException("Không thể trả hàng cho đơn hàng chưa thanh toán");
                                }
                                break;
                }

                // 6. Lưu bill
                Bill savedBill = billRepository.save(bill);

                // 7. Trả về response
                return BillResponseDTO.builder()
                                .id(savedBill.getId())
                                .code(savedBill.getCode())
                                .status(savedBill.getStatus())
                                .totalMoney(savedBill.getTotalMoney())
                                .reductionAmount(savedBill.getReductionAmount())
                                .moneyShip(savedBill.getMoneyShip())
                                .finalAmount(
                                                savedBill.getTotalMoney()
                                                                .subtract(savedBill.getReductionAmount())
                                                                .add(savedBill.getMoneyShip()))
                                .createdAt(savedBill.getCreatedAt())
                                .employeeName(savedBill.getEmployee() != null ? savedBill.getEmployee().getName()
                                                : null)
                                .createdBy(savedBill.getCreatedBy())
                                .updatedBy(savedBill.getUpdatedBy())
                                .build();
        }

        @Override
        @Transactional
        public BillResponseDTO addVoucherToBill(Integer billId, String voucherCode) {
                // 1. Kiểm tra bill
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // 2. Kiểm tra voucher
                Voucher voucher = voucherRepository.findByCodeAndDeletedFalse(voucherCode)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy voucher"));

                // 3. Kiểm tra thời gian hiệu lực
                Instant now = Instant.now();
                if (now.isBefore(voucher.getStartTime())) {
                        throw new RuntimeException("Voucher chưa đến thời gian áp dụng");
                }
                if (now.isAfter(voucher.getEndTime())) {
                        throw new RuntimeException("Voucher đã hết hạn");
                }

                // 4. Kiểm tra trạng thái voucher
                switch (voucher.getStatus()) {
                        case COMING_SOON:
                                throw new RuntimeException("Voucher chưa đến thời gian áp dụng");
                        case EXPIRED:
                                throw new RuntimeException("Voucher đã hết hạn");
                        case USED_UP:
                                throw new RuntimeException("Voucher đã hết lượt sử dụng");
                        case INACTIVE:
                                throw new RuntimeException("Voucher đã bị vô hiệu hóa");
                        case ACTIVE:
                                // Tiếp tục xử lý
                                break;
                }

                // 5. Kiểm tra số lượng voucher
                if (voucher.getQuantity() <= 0) {
                        throw new RuntimeException("Voucher đã hết lượt sử dụng");
                }

                // 6. Kiểm tra giá trị đơn hàng tối thiểu
                if (bill.getTotalMoney().compareTo(voucher.getMinOrderValue()) < 0) {
                        throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinOrderValue()
                                        + " để áp dụng voucher");
                }

                // if (bill.getVoucher() != null) {
                // Voucher oldVoucher = bill.getVoucher();
                // oldVoucher.setQuantity(oldVoucher.getQuantity() + 1);
                // // Nếu voucher cũ đang ở trạng thái USED_UP và được hoàn trả, chuyển về
                // ACTIVE
                // if (oldVoucher.getStatus() == PromotionStatus.USED_UP) {
                // oldVoucher.setStatus(PromotionStatus.ACTIVE);
                // }
                // voucherRepository.save(oldVoucher);
                // }

                // 7. Tính số tiền giảm
                BigDecimal reductionAmount;
                if (voucher.getType() == VoucherType.PERCENTAGE) {
                        // Giảm theo phần trăm
                        if (voucher.getPercentageDiscountValue() == null) {
                                throw new RuntimeException("Voucher không có giá trị giảm giá phần trăm");
                        }
                        reductionAmount = bill.getTotalMoney()
                                        .multiply(voucher.getPercentageDiscountValue())
                                        .divide(BigDecimal.valueOf(100));

                        // Kiểm tra giá trị giảm tối đa
                        if (voucher.getMaxDiscountValue() != null &&
                                        reductionAmount.compareTo(voucher.getMaxDiscountValue()) > 0) {
                                reductionAmount = voucher.getMaxDiscountValue();
                        }
                } else {
                        // Giảm theo số tiền cố định
                        if (voucher.getFixedDiscountValue() == null) {
                                throw new RuntimeException("Voucher không có giá trị giảm giá cố định");
                        }
                        reductionAmount = voucher.getFixedDiscountValue();

                        // Kiểm tra nếu số tiền giảm lớn hơn tổng tiền
                        if (reductionAmount.compareTo(bill.getTotalMoney()) > 0) {
                                reductionAmount = bill.getTotalMoney();
                        }
                }

                // 8. Cập nhật bill
                bill.setReductionAmount(reductionAmount);
                bill.setUpdatedAt(now);
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                // 9. Giảm số lượng voucher
                voucher.setQuantity(voucher.getQuantity() - 1);
                // Nếu hết số lượng thì cập nhật trạng thái
                if (voucher.getQuantity() == 0) {
                        voucher.setStatus(PromotionStatus.USED_UP);
                }
                voucherRepository.save(voucher);

                // 10. Trả về response
                return BillResponseDTO.builder()
                                .id(savedBill.getId())
                                .code(savedBill.getCode())
                                .status(savedBill.getStatus())
                                .totalMoney(savedBill.getTotalMoney())
                                .reductionAmount(savedBill.getReductionAmount())
                                .moneyShip(savedBill.getMoneyShip())
                                .finalAmount(
                                                savedBill.getTotalMoney()
                                                                .subtract(savedBill.getReductionAmount())
                                                                .add(savedBill.getMoneyShip()))
                                .createdAt(savedBill.getCreatedAt())
                                .employeeName(savedBill.getEmployee() != null ? savedBill.getEmployee().getName()
                                                : null)
                                .createdBy(savedBill.getCreatedBy())
                                .updatedBy(savedBill.getUpdatedBy())
                                .build();
        }

        @Override
        @Transactional
        public PaymentResponseDTO processPayment(Integer billId, PaymentType paymentType, BigDecimal amount) {
                // 1. Kiểm tra bill
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // 2. Kiểm tra trạng thái bill
                if (bill.getStatus() != OrderStatus.PENDING) {
                        throw new RuntimeException(
                                        "Không thể thanh toán cho đơn hàng không ở trạng thái chờ thanh toán");
                }

                // 3. Tính toán số tiền cuối cùng
                BigDecimal finalAmount = bill.getTotalMoney()
                                .subtract(bill.getReductionAmount())
                                .add(bill.getMoneyShip());

                // 4. Xử lý theo loại thanh toán
                switch (paymentType) {
                        case CASH:
                                if (amount == null || amount.compareTo(finalAmount) < 0) {
                                        throw new RuntimeException("Số tiền thanh toán không đủ");
                                }
                                return processCashPayment(bill, finalAmount, amount);
                        case BANKING:
                                return processBankingPayment(bill, finalAmount);
                        case VNPAY:
                                return processVNPayPayment(bill, finalAmount);
                        default:
                                throw new RuntimeException("Loại thanh toán không hợp lệ");
                }
        }

        private PaymentResponseDTO processCashPayment(Bill bill, BigDecimal finalAmount, BigDecimal amount) {
                // Cập nhật bill
                bill.setType(PaymentType.CASH);
                bill.setStatus(OrderStatus.PAID);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                // Tạo OrderHistory
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(OrderStatus.PAID);
                orderHistory.setActionDescription("Thanh toán tiền mặt thành công");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(bill.getUpdatedBy());
                orderHistory.setUpdatedBy(bill.getUpdatedBy());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                // Cập nhật Transaction
                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.PAYMENT);
                transaction.setTotalMoney(amount);
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Thanh toán tiền mặt thành công");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                // Trả về response
                return PaymentResponseDTO.builder()
                                .bill(convertToBillResponseDTO(savedBill))
                                .paymentType(PaymentType.CASH)
                                .build();
        }

        private PaymentResponseDTO processBankingPayment(Bill bill, BigDecimal finalAmount) {
                // Cập nhật bill
                bill.setType(PaymentType.BANKING);
                bill.setStatus(OrderStatus.PENDING); // Vẫn giữ PENDING vì chưa thanh toán
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                // Tạo OrderHistory
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(OrderStatus.PENDING);
                orderHistory.setActionDescription("Đang chờ thanh toán chuyển khoản");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(bill.getUpdatedBy());
                orderHistory.setUpdatedBy(bill.getUpdatedBy());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                // Cập nhật Transaction
                Transaction transaction = transactionRepository.findByBillId(bill.getId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setType(TransactionType.ONLINE);
                transaction.setTotalMoney(finalAmount);
                transaction.setStatus(TransactionStatus.PENDING);
                transaction.setNote("Đang chờ thanh toán chuyển khoản");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                // Trả về thông tin chuyển khoản
                return PaymentResponseDTO.builder()
                                .bill(convertToBillResponseDTO(savedBill))
                                .paymentType(PaymentType.BANKING)
                                // .qrCode("https://api.vietqr.io/image/VCB-1234567890-1000000.jpg")
                                .qrCode("/asset/maqr.jpg")
                                .bankAccount("013607122")
                                .bankName("ACB")
                                .accountName("Nguyễn Như Thành")
                                .amount(finalAmount)
                                .build();
        }
        private PaymentResponseDTO processVNPayPayment(Bill bill, BigDecimal finalAmount) {
                // Xử lý thanh toán VNPay
                // ... code xử lý VNPay ...
                return null; // Tạm thời return null
            }

        // API xác nhận thanh toán chuyển khoản
        @Override
        @Transactional
        public BillResponseDTO confirmBankingPayment(Integer billId) {
                // 1. Kiểm tra bill
                Bill bill = billRepository.findById(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

                // 2. Kiểm tra trạng thái bill
                if (bill.getStatus() != OrderStatus.PENDING || bill.getType() != PaymentType.BANKING) {
                        throw new RuntimeException("Không thể xác nhận thanh toán cho đơn hàng này");
                }

                // 3. Cập nhật bill
                bill.setStatus(OrderStatus.PAID);
                bill.setUpdatedAt(Instant.now());
                bill.setUpdatedBy("system");
                Bill savedBill = billRepository.save(bill);

                // 4. Tạo OrderHistory
                OrderHistory orderHistory = new OrderHistory();
                orderHistory.setBill(bill);
                orderHistory.setStatusOrder(OrderStatus.PAID);
                orderHistory.setActionDescription("Xác nhận thanh toán chuyển khoản thành công");
                orderHistory.setCreatedAt(Instant.now());
                orderHistory.setUpdatedAt(Instant.now());
                orderHistory.setCreatedBy(bill.getUpdatedBy());
                orderHistory.setUpdatedBy(bill.getUpdatedBy());
                orderHistory.setDeleted(false);
                orderHistoryRepository.save(orderHistory);

                // 5. Cập nhật Transaction
                Transaction transaction = transactionRepository.findByBillId(billId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
                transaction.setStatus(TransactionStatus.SUCCESS);
                transaction.setNote("Xác nhận thanh toán chuyển khoản thành công");
                transaction.setUpdatedAt(Instant.now());
                transactionRepository.save(transaction);

                // 6. Trả về response
                return convertToBillResponseDTO(savedBill);
        }

        private BillResponseDTO convertToBillResponseDTO(Bill bill) {
            return BillResponseDTO.builder()
                    .id(bill.getId())
                    .code(bill.getCode())
                    .status(bill.getStatus())
                    .totalMoney(bill.getTotalMoney())
                    .reductionAmount(bill.getReductionAmount())
                    .moneyShip(bill.getMoneyShip())
                    .finalAmount(bill.getTotalMoney()
                            .subtract(bill.getReductionAmount())
                            .add(bill.getMoneyShip()))
                    .createdAt(bill.getCreatedAt())
                    .employeeName(bill.getEmployee() != null ? bill.getEmployee().getName() : null)
                    .createdBy(bill.getCreatedBy())
                    .updatedBy(bill.getUpdatedBy())
                    .build();
        }
}
