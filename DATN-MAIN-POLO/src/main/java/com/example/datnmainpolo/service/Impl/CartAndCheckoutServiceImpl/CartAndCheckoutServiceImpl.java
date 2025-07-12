package com.example.datnmainpolo.service.Impl.CartAndCheckoutServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;

import com.example.datnmainpolo.dto.CartDetailResponseDTO.CartDetailResponseDTO;
import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.entity.*;
import com.example.datnmainpolo.enums.*;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.BillService;
import com.example.datnmainpolo.service.CartAndCheckoutService;
import com.example.datnmainpolo.service.UserService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartAndCheckoutServiceImpl implements CartAndCheckoutService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CartAndCheckoutServiceImpl.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal FIXED_SHIPPING_COST = BigDecimal.valueOf(22000).setScale(2, RoundingMode.HALF_UP);

    private final CartRepository cartRepository;
    private final CartDetailRepository cartDetailRepository;
    private final BillRepository billRepository;
    private final BillDetailRepository billDetailRepository;
    private final ProductDetailRepository productDetailRepository;
    private final CustomerInformationRepository customerInformationRepository;
    private final UserRepository userRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final TransactionRepository transactionRepository;
    private final AccountVoucherRepository accountVoucherRepository;
    private final BillService billService;
    private final BillDetailService billDetailService;
    private final UserService userService;

    @PostConstruct
    public void validateConfig() {
        // No GHN API configuration needed anymore
    }

    @Override
    @Transactional
    public CartDetailResponseDTO addProductToCart(Integer userId, Integer productDetailId, Integer quantity) {
        LOGGER.info("Adding product {} to cart for user {}", productDetailId, userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByUserEntityId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUserEntity(user);
                    newCart.setCreatedDate(Instant.now());
                    return cartRepository.save(newCart);
                });

        ProductDetail productDetail = productDetailRepository.findById(productDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (productDetail.getQuantity() < quantity) {
            throw new RuntimeException("Số lượng sản phẩm trong kho không đủ");
        }

        CartDetail cartDetail = cartDetailRepository.findByCartIdAndDetailProductId(cart.getId(), productDetailId)
                .orElse(new CartDetail());

        cartDetail.setCart(cart);
        cartDetail.setDetailProduct(productDetail);
        cartDetail.setQuantity(cartDetail.getQuantity() != null ? cartDetail.getQuantity() + quantity : quantity);
        cartDetail.setCreatedAt(Instant.now());
        cartDetail.setUpdatedAt(Instant.now());
        cartDetail.setCreatedBy(user.getName());
        cartDetail.setUpdatedBy(user.getName());

        CartDetail savedCartDetail = cartDetailRepository.save(cartDetail);
        return convertToCartDetailResponseDTO(savedCartDetail);
    }

    @Override
    @Transactional
    public CartDetailResponseDTO updateCartItemQuantity(Integer cartDetailId, Integer quantity) {
        LOGGER.info("Updating quantity for cart detail {} to {}", cartDetailId, quantity);

        CartDetail cartDetail = cartDetailRepository.findById(cartDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết giỏ hàng"));

        ProductDetail productDetail = cartDetail.getDetailProduct();
        int quantityChange = quantity - cartDetail.getQuantity();

        if (productDetail.getQuantity() < quantityChange) {
            throw new RuntimeException("Số lượng sản phẩm trong kho không đủ");
        }

        cartDetail.setQuantity(quantity);
        cartDetail.setUpdatedAt(Instant.now());
        cartDetail.setUpdatedBy("system");
        CartDetail savedCartDetail = cartDetailRepository.save(cartDetail);

        return convertToCartDetailResponseDTO(savedCartDetail);
    }

    @Override
    @Transactional
    public void removeProductFromCart(Integer cartDetailId) {
        LOGGER.info("Removing cart detail {}", cartDetailId);

        CartDetail cartDetail = cartDetailRepository.findById(cartDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết giỏ hàng"));

        cartDetailRepository.delete(cartDetail);
    }

    @Override
    public List<CartDetailResponseDTO> getCartItems(Integer userId) {
        LOGGER.debug("Fetching cart items for user {}", userId);

        Cart cart = cartRepository.findByUserEntityId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cart.getId());
        return cartDetails.stream()
                .map(this::convertToCartDetailResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BillResponseDTO createBillFromCart(Integer userId, Integer addressId, PaymentType paymentType) {
        LOGGER.info("Creating bill from cart for user {} with payment type {} and address {}", userId, paymentType, addressId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByUserEntityId(userId)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng trống"));

        List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cart.getId());
        if (cartDetails.isEmpty()) {
            throw new RuntimeException("Giỏ hàng không có sản phẩm");
        }

        CustomerInformation customerInfo = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));
        if (!customerInfo.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Địa chỉ không thuộc về người dùng này");
        }

        // Validate address fields
        validateCustomerInformation(convertToCustomerInfoDTO(customerInfo));

        // Create new bill
        Bill bill = new Bill();
        bill.setCode("BILL_ONLINE_" + System.currentTimeMillis());
        bill.setStatus(paymentType == PaymentType.COD ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
        bill.setBillType(BillType.ONLINE);
        bill.setCustomer(user);
        bill.setCustomerName(customerInfo.getName());
        bill.setPhoneNumber(customerInfo.getPhoneNumber());
        bill.setAddress(customerInfo.getAddress());
        bill.setCustomerInfor(customerInfo);
        bill.setCreatedAt(Instant.now());
        bill.setUpdatedAt(Instant.now());
        bill.setCreatedBy(user.getName());
        bill.setUpdatedBy(user.getName());
        bill.setDeleted(false);
        bill.setTotalMoney(ZERO);
        bill.setMoneyShip(FIXED_SHIPPING_COST);
        bill.setReductionAmount(ZERO);
        bill.setFinalAmount(ZERO);
        bill.setCustomerPayment(ZERO);

        Bill savedBill = billRepository.save(bill);

        // Convert CartDetail to BillDetail
        for (CartDetail cartDetail : cartDetails) {
            ProductDetail productDetail = cartDetail.getDetailProduct();
            if (productDetail.getQuantity() < cartDetail.getQuantity()) {
                throw new RuntimeException("Số lượng sản phẩm " + productDetail.getCode() + " không đủ trong kho");
            }

            BillDetail billDetail = new BillDetail();
            billDetail.setBill(savedBill);
            billDetail.setDetailProduct(productDetail);
            billDetail.setQuantity(cartDetail.getQuantity());
            billDetail.setPrice(productDetail.getPrice());
            billDetail.setPromotionalPrice(productDetail.getPromotionalPrice());
            billDetail.setTypeOrder(paymentType == PaymentType.COD ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
            billDetail.setCreatedAt(Instant.now());
            billDetail.setUpdatedAt(Instant.now());
            billDetail.setCreatedBy(user.getName());
            billDetail.setUpdatedBy(user.getName());
            billDetail.setDeleted(false);

            billDetailRepository.save(billDetail);

            // Update total bill amount
            BigDecimal price = productDetail.getPromotionalPrice() != null
                    ? productDetail.getPromotionalPrice()
                    : productDetail.getPrice();
            BigDecimal totalPrice = price.multiply(BigDecimal.valueOf(cartDetail.getQuantity()));
            savedBill.setTotalMoney(savedBill.getTotalMoney().add(totalPrice));

            // Update inventory
            productDetail.setQuantity(productDetail.getQuantity() - cartDetail.getQuantity());
            if (productDetail.getQuantity() <= 0) {
                productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            }
            productDetailRepository.save(productDetail);
        }

        // Apply best user voucher
        AccountVoucher bestVoucher = applyBestUserVoucher(userId, savedBill.getTotalMoney());
        if (bestVoucher != null) {
            Voucher voucher = bestVoucher.getVoucher();
            BigDecimal reductionAmount = calculateReductionAmount(voucher, savedBill.getTotalMoney());
            savedBill.setReductionAmount(reductionAmount);
            savedBill.setVoucherCode(voucher.getCode());
            savedBill.setVoucherName(voucher.getName());

            // Update voucher quantity or status
            if (bestVoucher.getQuantity() > 1) {
                bestVoucher.setQuantity(bestVoucher.getQuantity() - 1);
            } else {
                bestVoucher.setStatus(false);
            }
            accountVoucherRepository.save(bestVoucher);
        } else {
            // Apply public voucher if no user voucher
            billService.applyBestPublicVoucher(savedBill);
        }

        // Update final amount including fixed shipping cost
        savedBill.setFinalAmount(savedBill.getTotalMoney()
                .subtract(savedBill.getReductionAmount())
                .add(savedBill.getMoneyShip()));
        savedBill = billRepository.save(bill);

        // Update loyalty points
        BigDecimal loyaltyPoints = savedBill.getFinalAmount().divide(BigDecimal.valueOf(10000), 0, RoundingMode.FLOOR);
        user.setLoyaltyPoints(user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() + loyaltyPoints.intValue() : loyaltyPoints.intValue());
        userRepository.save(user);

        // Clear cart
        cartDetailRepository.deleteAll(cartDetails);

        // Log order history
        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(savedBill);
        orderHistory.setStatusOrder(savedBill.getStatus());
        orderHistory.setActionDescription("Tạo hóa đơn online từ giỏ hàng" + (bestVoucher != null ? " với voucher " + bestVoucher.getVoucher().getCode() : ""));
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy(user.getName());
        orderHistory.setUpdatedBy(user.getName());
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);

        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setBill(savedBill);
        transaction.setType(paymentType == PaymentType.COD ? TransactionType.PAYMENT : TransactionType.ONLINE);
        transaction.setTotalMoney(savedBill.getFinalAmount());
        transaction.setStatus(paymentType == PaymentType.COD ? TransactionStatus.PENDING : TransactionStatus.PENDING);

        transaction.setCreatedAt(Instant.now());
        transaction.setUpdatedAt(Instant.now());
        transaction.setDeleted(false);
        transactionRepository.save(transaction);

        return billService.convertToBillResponseDTO(savedBill);
    }

    @Override
    @Transactional
    public void updateCustomerInformation(Integer billId, Integer addressId) {
        LOGGER.info("Updating customer information for bill {} with address {}", billId, addressId);

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getStatus() != OrderStatus.PENDING && bill.getStatus() != OrderStatus.CONFIRMING) {
            throw new RuntimeException("Chỉ có thể cập nhật thông tin giao hàng cho hóa đơn ở trạng thái PENDING hoặc CONFIRMING");
        }

        CustomerInformation customerInfo = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));
        if (!customerInfo.getCustomer().getId().equals(bill.getCustomer().getId())) {
            throw new RuntimeException("Địa chỉ không thuộc về người dùng này");
        }

        // Validate address fields
        validateCustomerInformation(convertToCustomerInfoDTO(customerInfo));

        // Update bill with new address
        bill.setCustomerInfor(customerInfo);
        bill.setCustomerName(customerInfo.getName());
        bill.setPhoneNumber(customerInfo.getPhoneNumber());
        bill.setAddress(customerInfo.getAddress());

        // Set fixed shipping cost
        bill.setMoneyShip(FIXED_SHIPPING_COST);

        // Update final amount
        bill.setFinalAmount(bill.getTotalMoney()
                .subtract(bill.getReductionAmount())
                .add(bill.getMoneyShip()));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);

        // Log order history
        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(bill);
        orderHistory.setStatusOrder(bill.getStatus());
        orderHistory.setActionDescription("Cập nhật thông tin giao hàng");
        orderHistory.setCreatedAt(Instant.now());
        orderHistory.setUpdatedAt(Instant.now());
        orderHistory.setCreatedBy("system");
        orderHistory.setUpdatedBy("system");
        orderHistory.setDeleted(false);
        orderHistoryRepository.save(orderHistory);
    }

    @Override
    @Transactional
    public PaymentResponseDTO processOnlinePayment(Integer billId, PaymentType paymentType, BigDecimal amount) {
        LOGGER.info("Processing online payment for bill {} with type {}", billId, paymentType);

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getCustomerInfor() == null) {
            throw new RuntimeException("Vui lòng cung cấp thông tin giao hàng trước khi thanh toán");
        }

        if (paymentType != PaymentType.BANKING && paymentType != PaymentType.VNPAY && paymentType != PaymentType.COD) {
            throw new RuntimeException("Phương thức thanh toán không được hỗ trợ");
        }

        if (paymentType == PaymentType.COD) {
            bill.setStatus(OrderStatus.CONFIRMING);
            bill.setUpdatedAt(Instant.now());
            bill.setUpdatedBy("system");
            billRepository.save(bill);

            List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
            for (BillDetail billDetail : billDetails) {
                billDetail.setTypeOrder(OrderStatus.CONFIRMING);
                billDetail.setUpdatedAt(Instant.now());
                billDetail.setUpdatedBy("system");
                billDetailRepository.save(billDetail);
            }

            Transaction transaction = transactionRepository.findByBillId(billId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
            transaction.setType(TransactionType.PAYMENT);
            transaction.setStatus(TransactionStatus.PENDING);
            transaction.setNote("Khởi tạo giao dịch COD");
            transaction.setUpdatedAt(Instant.now());
            transactionRepository.save(transaction);
        }

        return billService.processPayment(billId, paymentType, amount);
    }

    @Override
    @Transactional
    public BillResponseDTO confirmOnlinePayment(Integer billId) {
        LOGGER.info("Confirming online payment for bill {}", billId);
        return billService.confirmBankingPayment(billId);
    }

    @Override
    public Page<BillResponseDTO> getUserBills(Integer userId, Pageable pageable) {
        LOGGER.debug("Fetching bills for user {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Page<Bill> bills = billRepository.findByCustomerIdAndDeletedFalse(userId, pageable);
        List<BillResponseDTO> billDTOs = bills.getContent().stream()
                .map(billService::convertToBillResponseDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(billDTOs, pageable, bills.getTotalElements());
    }

    @Override
    @Transactional
    public AccountVoucher applyBestUserVoucher(Integer userId, BigDecimal totalMoney) {
        LOGGER.info("Applying best voucher for user {} with total money {}", userId, totalMoney);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        List<AccountVoucher> vouchers = accountVoucherRepository.findByUserEntityIdAndStatusTrueAndDeletedFalse(userId);
        if (vouchers.isEmpty()) {
            LOGGER.debug("No valid vouchers found for user {}", userId);
            return null;
        }

        AccountVoucher bestVoucher = vouchers.stream()
                .filter(voucher -> {
                    Voucher v = voucher.getVoucher();
                    boolean validOrderValue = v.getMinOrderValue() == null || totalMoney.compareTo(v.getMinOrderValue()) >= 0;
                    boolean validUserType = v.getTypeUser() == null || v.getTypeUser().name().equals(user.getRole().name());
                    boolean validTime = (v.getStartTime() == null || v.getStartTime().isBefore(Instant.now())) &&
                            (v.getEndTime() == null || v.getEndTime().isAfter(Instant.now()));
                    return validOrderValue && validUserType && validTime;
                })
                .max(Comparator.comparing(voucher -> calculateReductionAmount(voucher.getVoucher(), totalMoney)))
                .orElse(null);

        if (bestVoucher != null) {
            LOGGER.info("Selected voucher {} with reduction amount {}", bestVoucher.getVoucher().getCode(), calculateReductionAmount(bestVoucher.getVoucher(), totalMoney));
        }

        return bestVoucher;
    }

    @Override
    public BigDecimal calculateShippingCost(Integer toDistrictId, String toWardCode, Integer weight, Integer length, Integer width, Integer height) {
        LOGGER.info("Applying fixed shipping cost of 22000 VND for district {} and ward {}", toDistrictId, toWardCode);
        return FIXED_SHIPPING_COST;
    }

    private BigDecimal calculateReductionAmount(Voucher voucher, BigDecimal totalMoney) {
        BigDecimal reductionAmount = ZERO;
        if (voucher.getFixedDiscountValue() != null && voucher.getFixedDiscountValue().compareTo(ZERO) > 0) {
            reductionAmount = voucher.getFixedDiscountValue();
        } else if (voucher.getPercentageDiscountValue() != null && voucher.getPercentageDiscountValue().compareTo(ZERO) > 0) {
            reductionAmount = totalMoney.multiply(voucher.getPercentageDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountValue() != null && reductionAmount.compareTo(voucher.getMaxDiscountValue()) > 0) {
                reductionAmount = voucher.getMaxDiscountValue();
            }
        }
        return reductionAmount;
    }

    private void validateCustomerInformation(CustomerInformationRequestDTO customerInfo) {
        if (customerInfo.getProvinceId() == null) {
            throw new RuntimeException("Thông tin tỉnh/thành phố không được để trống");
        }
        if (customerInfo.getDistrictId() == null) {
            throw new RuntimeException("Thông tin quận/huyện không được để trống");
        }
        if (customerInfo.getWardCode() == null) {
            throw new RuntimeException("Thông tin xã/phường không được để trống");
        }
        if (customerInfo.getPhoneNumber() == null || customerInfo.getPhoneNumber().isEmpty()) {
            throw new RuntimeException("Số điện thoại không được để trống");
        }
    }

    private CustomerInformationRequestDTO convertToCustomerInfoDTO(CustomerInformation customerInfo) {
        return CustomerInformationRequestDTO.builder()
                .id(customerInfo.getId())
                .name(customerInfo.getName())
                .phoneNumber(customerInfo.getPhoneNumber())
                .address(customerInfo.getAddress())
                .provinceName(customerInfo.getProvinceName())
                .provinceId(customerInfo.getProvinceId())
                .districtName(customerInfo.getDistrictName())
                .districtId(customerInfo.getDistrictId())
                .wardName(customerInfo.getWardName())
                .wardCode(customerInfo.getWardCode())
                .isDefault(customerInfo.getIsDefault())
                .build();
    }

    private CartDetailResponseDTO convertToCartDetailResponseDTO(CartDetail cartDetail) {
        ProductDetail productDetail = cartDetail.getDetailProduct();
        BigDecimal price = productDetail.getPromotionalPrice() != null
                ? productDetail.getPromotionalPrice()
                : productDetail.getPrice();
        BigDecimal totalPrice = price.multiply(BigDecimal.valueOf(cartDetail.getQuantity()));

        List<CartDetailResponseDTO.ImageDTO> images = productDetail.getImages().stream()
                .map(image -> CartDetailResponseDTO.ImageDTO.builder()
                        .id(image.getId())
                        .url(image.getUrl())
                        .build())
                .collect(Collectors.toList());

        return CartDetailResponseDTO.builder()
                .id(cartDetail.getId())
                .cartId(cartDetail.getCart().getId())
                .productDetailId(productDetail.getId())
                .productName(productDetail.getProduct().getName())
                .productColor(productDetail.getColor().getName())
                .productSize(productDetail.getSize().getName())
                .quantity(cartDetail.getQuantity())
                .price(price)
                .totalPrice(totalPrice)
                .images(images)
                .createdAt(cartDetail.getCreatedAt())
                .updatedAt(cartDetail.getUpdatedAt())
                .build();
    }
}