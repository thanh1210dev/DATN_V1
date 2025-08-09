package com.example.datnmainpolo.service.Impl.CartAndCheckoutServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;

import com.example.datnmainpolo.dto.CartDetailResponseDTO.CartDetailResponseDTO;
import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationOnlineRequestDTO;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings({"unused"})
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
    // private final BillDetailService billDetailService; // may be used later
    // private final UserService userService; // may be used later
    // Inject RestTemplate for GHN API calls
    private final org.springframework.web.client.RestTemplate restTemplate;

    @Value("${ghn.api.token}")
    private String ghnToken;

    @Value("${ghn.api.shop-id}")
    private String shopId;

    @Value("${ghn.api.base-url}")
    private String ghnBaseUrl;

    @PostConstruct
    public void validateConfig() {
        // No GHN API configuration needed anymore
    }

    @Override
    @Transactional
    public CartDetailResponseDTO addProductToCart(Integer userId, Integer productDetailId, Integer quantity) {
        System.out.println("=== ADD TO CART DEBUG START ===");
        System.out
                .println("User ID: " + userId + ", Product Detail ID: " + productDetailId + ", Quantity: " + quantity);

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
        System.out
                .println("=== ADD TO CART DEBUG END - Cart detail saved with ID: " + savedCartDetail.getId() + " ===");
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
    @Transactional
    public void clearCart(Integer userId) {
        LOGGER.info("Clearing cart for user {}", userId);

        try {
            Cart cart = cartRepository.findByUserEntityId(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

            List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cart.getId());
            if (!cartDetails.isEmpty()) {
                cartDetailRepository.deleteAll(cartDetails);
                LOGGER.info("Cleared {} items from cart for user {}", cartDetails.size(), userId);
            } else {
                LOGGER.info("No cart items found for user {}", userId);
            }
        } catch (Exception e) {
            LOGGER.error("Error clearing cart for user {}", userId, e);
            throw new RuntimeException("Lỗi khi xóa giỏ hàng: " + e.getMessage());
        }
    }

    @Override
    public List<CartDetailResponseDTO> getCartItems(Integer userId) {
        System.out.println("=== GET CART ITEMS DEBUG START ===");
        System.out.println("User ID: " + userId);

        LOGGER.debug("Fetching cart items for user {}", userId);

        Cart cart = cartRepository.findByUserEntityId(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));
        System.out.println("Cart found with ID: " + cart.getId());

        List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cart.getId());
        System.out.println("Cart details count: " + cartDetails.size());

        List<CartDetailResponseDTO> result = cartDetails.stream()
                .map(this::convertToCartDetailResponseDTO)
                .collect(Collectors.toList());

        System.out.println("=== GET CART ITEMS DEBUG END - returning " + result.size() + " items ===");
        return result;
    }

    @Override
    @Transactional
    public BillResponseDTO createBillFromCart(Integer userId, Integer addressId, PaymentType paymentType) {
        System.out.println("=== CREATE BILL DEBUG START ===");
        System.out.println("User ID: " + userId + ", Address ID: " + addressId + ", Payment Type: " + paymentType);

        LOGGER.info("Creating bill from cart for user {} with payment type {} and address {}", userId, paymentType,
                addressId);

        // Validate all required inputs
        if (userId == null || addressId == null || paymentType == null) {
            throw new RuntimeException("Thiếu thông tin bắt buộc để tạo hóa đơn");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByUserEntityId(userId)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng trống"));

        List<CartDetail> cartDetails = cartDetailRepository.findByCartId(cart.getId());
        System.out.println("Cart details found: " + cartDetails.size() + " items");
        if (cartDetails.isEmpty()) {
            System.out.println("❌ CART IS EMPTY - cannot create bill");
            throw new RuntimeException("Giỏ hàng không có sản phẩm");
        }

        CustomerInformation customerInfo = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));
        if (!customerInfo.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Địa chỉ không thuộc về người dùng này");
        }

        // Validate address fields
        try {
            validateCustomerInformation(convertToCustomerInfoDTO(customerInfo));
        } catch (Exception e) {
            LOGGER.error("Lỗi khi xác thực thông tin địa chỉ: {}", e.getMessage());
            throw new RuntimeException("Địa chỉ không hợp lệ: " + e.getMessage());
        }

        // Create new bill
        Bill bill = new Bill();
        bill.setCode("BILL_ONLINE_" + System.currentTimeMillis());
        bill.setStatus(paymentType == PaymentType.COD ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
        bill.setType(paymentType); // ensure bill type is set
        // new axes
        bill.setPaymentStatus(paymentType == PaymentType.COD ? PaymentStatus.UNPAID : PaymentStatus.PENDING);
        bill.setFulfillmentStatus(paymentType == PaymentType.COD ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
        bill.setBillType(BillType.ONLINE);
        bill.setCustomer(user);
        bill.setCustomerName(customerInfo.getName());
        bill.setPhoneNumber(customerInfo.getPhoneNumber());
        // Build full address: detail + ward + district + province
        String fullAddress1 = String.format("%s, %s, %s, %s",
                customerInfo.getAddress() != null ? customerInfo.getAddress() : "",
                customerInfo.getWardName() != null ? customerInfo.getWardName() : "",
                customerInfo.getDistrictName() != null ? customerInfo.getDistrictName() : "",
                customerInfo.getProvinceName() != null ? customerInfo.getProvinceName() : "").replaceAll(",\s*,", ", ").replaceAll("^,\s*|\s*,\s*$", "");
        bill.setAddress(fullAddress1);
        bill.setCustomerInfor(customerInfo);
        bill.setCreatedAt(Instant.now());
        bill.setUpdatedAt(Instant.now());
        bill.setCreatedBy(user.getName());
        bill.setUpdatedBy(user.getName());
        bill.setDeleted(false);
        bill.setTotalMoney(ZERO);

        // Tính phí vận chuyển thực tế dựa trên thông tin địa chỉ và tổng khối lượng sản
        // phẩm
        // Giả sử mỗi sản phẩm có trọng lượng 500g
        Integer totalWeight = cartDetails.stream()
                .mapToInt(detail -> 500 * detail.getQuantity())
                .sum();

        // Nếu không có sản phẩm hoặc tổng khối lượng quá nhỏ, sử dụng giá trị mặc định
        if (totalWeight <= 0) {
            totalWeight = 500;
        }

        // Tính phí vận chuyển bằng API GHN
        BigDecimal shippingFee;
        try {
            shippingFee = calculateShippingFee(
                    customerInfo.getDistrictId(),
                    customerInfo.getWardCode(),
                    totalWeight,
                    30, // length - chiều dài mặc định
                    20, // width - chiều rộng mặc định
                    10 // height - chiều cao mặc định
            );
        } catch (Exception e) {
            LOGGER.error("Lỗi khi tính phí vận chuyển cho hóa đơn mới: {}", e.getMessage());
            try {
                // Thử lại với các giá trị mặc định khác nếu có lỗi
                LOGGER.info("Thử lại tính phí vận chuyển với giá trị mặc định");
                shippingFee = calculateShippingFee(
                        customerInfo.getDistrictId(),
                        customerInfo.getWardCode(),
                        500, // weight mặc định 500g
                        30, // length
                        20, // width
                        10 // height
                );
            } catch (Exception ex) {
                LOGGER.error("Không thể tính phí vận chuyển, sử dụng giá trị cố định: {}", ex.getMessage());
                shippingFee = FIXED_SHIPPING_COST; // Chỉ dùng cố định khi thực sự không tính được
            }
        }

        bill.setMoneyShip(shippingFee);
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
            // typeOrder removed from BillDetail
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

            // Do NOT deduct inventory here for ONLINE orders.
            // Stock will be reduced later:
            // - COD: when order is CONFIRMED (see BillServiceImpl.updateBillStatus -> CONFIRMED)
            // - VNPAY/BANKING: when payment is successful (VNPay callback / confirmBankingPayment)
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
                // Quantity consumed => mark as used up (status=true)
                bestVoucher.setQuantity(0);
                bestVoucher.setStatus(true);
            }
            accountVoucherRepository.save(bestVoucher);
        } else {
            // Don't apply public voucher automatically - let user choose in frontend
            LOGGER.info("No private voucher found for user {}. User can select public vouchers manually in checkout.",
                    userId);
        }

        // Update final amount including fixed shipping cost
        savedBill.setFinalAmount(savedBill.getTotalMoney()
                .subtract(savedBill.getReductionAmount())
                .add(savedBill.getMoneyShip()));
        savedBill = billRepository.save(savedBill);

        System.out.println("=== FINAL AMOUNT CALCULATION DEBUG ===");
        System.out.println("Total Money: " + savedBill.getTotalMoney());
        System.out.println("Reduction Amount: " + savedBill.getReductionAmount());
        System.out.println("Shipping Fee: " + savedBill.getMoneyShip());
        System.out.println("Final Amount: " + savedBill.getFinalAmount());

        // Update loyalty points
        BigDecimal loyaltyPoints = savedBill.getFinalAmount().divide(BigDecimal.valueOf(10000), 0, RoundingMode.FLOOR);
        user.setLoyaltyPoints(user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() + loyaltyPoints.intValue()
                : loyaltyPoints.intValue());
        userRepository.save(user);

        // Clear cart only for COD payment - VNPAY will clear cart after successful
        // callback
        System.out.println("=== CART CLEARING DEBUG ===");
        System.out.println("Payment type: " + paymentType);
        System.out.println("Is COD? " + (paymentType == PaymentType.COD));
        System.out.println("Is VNPAY? " + (paymentType == PaymentType.VNPAY));

        if (paymentType == PaymentType.COD) {
            System.out.println("CLEARING CART for COD payment");
            cartDetailRepository.deleteAll(cartDetails);
        } else {
            System.out.println("NOT CLEARING CART - payment type is: " + paymentType);
        }

        System.out.println("=== CREATE BILL DEBUG END - Bill ID: " + savedBill.getId() + " ===");

        // Log order history
        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(savedBill);
        orderHistory.setStatusOrder(savedBill.getStatus());
        orderHistory.setActionDescription("Tạo hóa đơn online từ giỏ hàng"
                + (bestVoucher != null ? " với voucher " + bestVoucher.getVoucher().getCode() : ""));
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
    public BillResponseDTO createBillFromSelectedItems(Integer userId, Integer addressId, PaymentType paymentType,
            Integer voucherId, List<Integer> selectedCartDetailIds) {
        System.out.println("=== CREATE BILL FROM SELECTED ITEMS DEBUG START ===");
        System.out.println("User ID: " + userId + ", Address ID: " + addressId + ", Payment Type: " + paymentType
                + ", Voucher ID: " + voucherId);
        System.out.println("Selected Cart Detail IDs: " + selectedCartDetailIds);

        LOGGER.info(
                "Creating bill from selected cart items for user {} with payment type {}, address {} and voucher {}",
                userId, paymentType, addressId, voucherId);

        // Validate all required inputs
        if (userId == null || addressId == null || paymentType == null || selectedCartDetailIds == null
                || selectedCartDetailIds.isEmpty()) {
            throw new RuntimeException("Thiếu thông tin bắt buộc để tạo hóa đơn");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Cart cart = cartRepository.findByUserEntityId(userId)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng trống"));

        // Get only selected cart items
        List<CartDetail> selectedCartDetails = cartDetailRepository.findAllById(selectedCartDetailIds);
        System.out.println("Selected cart details found: " + selectedCartDetails.size() + " items");

        // Filter to only items belonging to this user's cart
        selectedCartDetails = selectedCartDetails.stream()
                .filter(detail -> detail.getCart().getId().equals(cart.getId()))
                .collect(Collectors.toList());

        if (selectedCartDetails.isEmpty()) {
            System.out.println("❌ NO SELECTED ITEMS - cannot create bill");
            throw new RuntimeException("Không có sản phẩm nào được chọn hoặc sản phẩm không thuộc về bạn");
        }

        CustomerInformation customerInfo = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));

        if (!customerInfo.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Địa chỉ không thuộc về người dùng này");
        }

        // Validate address fields
        try {
            validateCustomerInformation(convertToCustomerInfoDTO(customerInfo));
        } catch (Exception e) {
            LOGGER.error("Lỗi khi xác thực thông tin địa chỉ: {}", e.getMessage());
            throw new RuntimeException("Địa chỉ không hợp lệ: " + e.getMessage());
        }

        // Create new bill
        Bill bill = new Bill();
        bill.setCode("BILL_SELECTED_" + System.currentTimeMillis());
        bill.setType(paymentType);
        bill.setStatus(paymentType == PaymentType.COD ? OrderStatus.CONFIRMING : OrderStatus.PENDING);
        // new axes
        bill.setPaymentStatus(paymentType == PaymentType.COD ? PaymentStatus.UNPAID : PaymentStatus.PENDING);
        bill.setFulfillmentStatus(paymentType == PaymentType.COD ? FulfillmentStatus.CONFIRMING : FulfillmentStatus.PENDING);
        bill.setBillType(BillType.ONLINE);
        bill.setCustomer(user);
        bill.setCustomerName(customerInfo.getName());
        bill.setPhoneNumber(customerInfo.getPhoneNumber());
        // Build full address: detail + ward + district + province
        String fullAddress2 = String.format("%s, %s, %s, %s",
                customerInfo.getAddress() != null ? customerInfo.getAddress() : "",
                customerInfo.getWardName() != null ? customerInfo.getWardName() : "",
                customerInfo.getDistrictName() != null ? customerInfo.getDistrictName() : "",
                customerInfo.getProvinceName() != null ? customerInfo.getProvinceName() : "").replaceAll(",\s*,", ", ").replaceAll("^,\s*|\s*,\s*$", "");
        bill.setAddress(fullAddress2);
        bill.setCustomerInfor(customerInfo);
        bill.setCreatedAt(Instant.now());
        bill.setUpdatedAt(Instant.now());
        bill.setCreatedBy(user.getName());
        bill.setUpdatedBy(user.getName());
        bill.setDeleted(false);
        bill.setTotalMoney(ZERO);

        // Calculate shipping fee based on selected items weight
        Integer totalWeight = selectedCartDetails.stream()
                .mapToInt(detail -> 500 * detail.getQuantity())
                .sum();

        if (totalWeight <= 0) {
            totalWeight = 500;
        }

        BigDecimal shippingFee;
        try {
            shippingFee = calculateShippingFee(
                    customerInfo.getDistrictId(),
                    customerInfo.getWardCode(),
                    totalWeight,
                    30, 20, 10);
        } catch (Exception e) {
            LOGGER.error("Lỗi khi tính phí vận chuyển: {}", e.getMessage());
            shippingFee = FIXED_SHIPPING_COST;
        }

        bill.setMoneyShip(shippingFee);
        bill.setReductionAmount(ZERO);
        bill.setFinalAmount(ZERO);
        bill.setCustomerPayment(ZERO);

        Bill savedBill = billRepository.save(bill);

        // Convert selected CartDetails to BillDetails
        for (CartDetail cartDetail : selectedCartDetails) {
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
            // typeOrder removed from BillDetail
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

            // Do NOT deduct inventory here for ONLINE orders.
            // Stock will be reduced later upon payment/confirmation success.
        }

        // Apply voucher if provided
        if (voucherId != null) {
            System.out.println("=== APPLYING VOUCHER ===");
            System.out.println("DEBUG: userId = " + userId + ", voucherId = " + voucherId);
            AccountVoucher accountVoucher = accountVoucherRepository
                    .findByUserEntityIdAndVoucherIdAndDeletedFalse(userId, voucherId);
            System.out.println("DEBUG: accountVoucher result = " + accountVoucher);
            if (accountVoucher == null) {
                throw new RuntimeException("Voucher không có trong tài khoản của bạn");
            }
            // Sửa logic: status=false (0) là còn hiệu lực, status=true (1) là đã dùng hết
            // Auto-heal dữ liệu cũ: nếu status=true nhưng quantity>0 thì reset về false để sử dụng được
            if (Boolean.TRUE.equals(accountVoucher.getStatus())) {
                if (accountVoucher.getQuantity() != null && accountVoucher.getQuantity() > 0) {
                    System.out.println("LEGACY FIX: AccountVoucher.status=true nhưng quantity>0. Reset status=false");
                    accountVoucher.setStatus(false);
                    accountVoucherRepository.save(accountVoucher);
                } else {
                    throw new RuntimeException("Voucher đã được sử dụng hoặc không còn hiệu lực");
                }
            }
            if (accountVoucher.getQuantity() == null || accountVoucher.getQuantity() <= 0) {
                throw new RuntimeException("Voucher đã hết số lượng");
            }
            Voucher voucher = accountVoucher.getVoucher();
            if (voucher == null) {
                throw new RuntimeException("Không tìm thấy thông tin voucher");
            }
            if (voucher.getMinOrderValue() != null
                    && savedBill.getTotalMoney().compareTo(voucher.getMinOrderValue()) < 0) {
                throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher");
            }
            // Kiểm tra thời hạn voucher
            if (voucher.getEndTime() != null && voucher.getEndTime().isBefore(Instant.now())) {
                throw new RuntimeException("Voucher đã hết hạn sử dụng");
            }
            if (voucher.getStartTime() != null && voucher.getStartTime().isAfter(Instant.now())) {
                throw new RuntimeException("Voucher chưa đến thời gian sử dụng");
            }
            BigDecimal reductionAmount = calculateReductionAmount(voucher, savedBill.getTotalMoney());
            savedBill.setReductionAmount(reductionAmount);
            savedBill.setVoucherCode(voucher.getCode());
            savedBill.setVoucherName(voucher.getName());
            // Trừ số lượng, set status=true nếu hết (đã dùng hết)
            if (accountVoucher.getQuantity() > 1) {
                accountVoucher.setQuantity(accountVoucher.getQuantity() - 1);
            } else {
                accountVoucher.setQuantity(0);
                accountVoucher.setStatus(true);
            }
            accountVoucherRepository.save(accountVoucher);
            System.out.println("Applied voucher: " + voucher.getCode() + ", reduction: " + reductionAmount);
        }

        // Update final amount
        savedBill.setFinalAmount(savedBill.getTotalMoney()
                .subtract(savedBill.getReductionAmount())
                .add(savedBill.getMoneyShip()));
        savedBill = billRepository.save(savedBill);

        // Update loyalty points
        BigDecimal loyaltyPoints = savedBill.getFinalAmount().divide(BigDecimal.valueOf(10000), 0, RoundingMode.FLOOR);
        user.setLoyaltyPoints(user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() + loyaltyPoints.intValue()
                : loyaltyPoints.intValue());
        userRepository.save(user);

        // Clear only selected cart items for COD payment
        if (paymentType == PaymentType.COD) {
            System.out.println("CLEARING SELECTED CART ITEMS for COD payment");
            cartDetailRepository.deleteAll(selectedCartDetails);
        } else {
            System.out.println("NOT CLEARING CART - payment type is: " + paymentType);
        }

        // Log order history
        OrderHistory orderHistory = new OrderHistory();
        orderHistory.setBill(savedBill);
        orderHistory.setStatusOrder(savedBill.getStatus());
        orderHistory.setActionDescription("Tạo hóa đơn online từ sản phẩm được chọn"
                + (savedBill.getVoucherCode() != null ? " với voucher " + savedBill.getVoucherCode() : ""));
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

        System.out.println("=== CREATE BILL FROM SELECTED ITEMS DEBUG END - Bill ID: " + savedBill.getId() + " ===");
        return billService.convertToBillResponseDTO(savedBill);
    }

    @Transactional
    @Override
    public void rollbackVoucher(Integer billId) {
        System.out.println("=== ROLLBACK VOUCHER START ===");
        System.out.println("Bill ID: " + billId);

        try {
            Bill bill = billRepository.findById(billId).orElse(null);
            if (bill != null && bill.getVoucherCode() != null) {
                System.out.println("Found bill with voucher code: " + bill.getVoucherCode());

                // Tìm AccountVoucher dựa trên userId và voucherCode
                List<AccountVoucher> accountVouchers = accountVoucherRepository
                        .findByUserEntityIdAndDeletedFalse(bill.getCustomer().getId());

                AccountVoucher voucherToRestore = accountVouchers.stream()
                        .filter(av -> av.getVoucher().getCode().equals(bill.getVoucherCode()))
                        .findFirst()
                        .orElse(null);

                if (voucherToRestore != null) {
                    // Hoàn lại số lượng voucher
                    voucherToRestore.setQuantity(voucherToRestore.getQuantity() + 1);
                    voucherToRestore.setStatus(false); // Kích hoạt lại voucher
                    voucherToRestore.setUpdatedAt(Instant.now());
                    accountVoucherRepository.save(voucherToRestore);

                    System.out.println("ROLLBACK SUCCESS: Voucher " + bill.getVoucherCode() +
                            " quantity restored to " + voucherToRestore.getQuantity());

                    // Log order history
                    OrderHistory orderHistory = new OrderHistory();
                    orderHistory.setBill(bill);
                    orderHistory.setStatusOrder(bill.getStatus());
                    orderHistory.setActionDescription(
                            "Hoàn lại voucher " + bill.getVoucherCode() + " do thanh toán thất bại");
                    orderHistory.setCreatedAt(Instant.now());
                    orderHistory.setUpdatedAt(Instant.now());
                    orderHistory.setCreatedBy("system");
                    orderHistory.setUpdatedBy("system");
                    orderHistory.setDeleted(false);
                    orderHistoryRepository.save(orderHistory);
                } else {
                    System.out
                            .println("ROLLBACK WARNING: Cannot find AccountVoucher for code " + bill.getVoucherCode());
                }
            } else {
                System.out.println("ROLLBACK SKIP: No bill found or no voucher used");
            }
        } catch (Exception e) {
            System.out.println("ROLLBACK ERROR: " + e.getMessage());
            LOGGER.error("Error during voucher rollback for bill {}: {}", billId, e.getMessage());
        }

        System.out.println("=== ROLLBACK VOUCHER END ===");
    }

    // Helper mappers already used below
    private CartDetailResponseDTO convertToCartDetailResponseDTO(CartDetail cartDetail) {
        ProductDetail pd = cartDetail.getDetailProduct();
        BigDecimal unitPrice = pd.getPromotionalPrice() != null ? pd.getPromotionalPrice() : pd.getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(cartDetail.getQuantity()));

        // Safely resolve color, size with debug logging
        String colorName = null;
        String sizeName = null;
        if (pd != null) {
            if (pd.getColor() != null) {
                colorName = pd.getColor().getName();
                System.out.println("🎨 [CART DEBUG] Found color: " + colorName + " for product: " + (pd.getProduct() != null ? pd.getProduct().getName() : "Unknown"));
            } else {
                System.out.println("⚠️ [CART DEBUG] No color found for product: " + (pd.getProduct() != null ? pd.getProduct().getName() : "Unknown"));
            }
            if (pd.getSize() != null) {
                sizeName = pd.getSize().getName();
                System.out.println("📏 [CART DEBUG] Found size: " + sizeName + " for product: " + (pd.getProduct() != null ? pd.getProduct().getName() : "Unknown"));
            } else {
                System.out.println("⚠️ [CART DEBUG] No size found for product: " + (pd.getProduct() != null ? pd.getProduct().getName() : "Unknown"));
            }
        }

        // Map images -> DTOs (keep order as provided by DB)
        java.util.List<CartDetailResponseDTO.ImageDTO> imageDTOs = java.util.Collections.emptyList();
        if (pd != null && pd.getImages() != null && !pd.getImages().isEmpty()) {
            imageDTOs = pd.getImages().stream()
                    // Optional: skip deleted images if flagged
                    .filter(img -> img != null && (img.getDeleted() == null || !img.getDeleted()))
                    .map(img -> CartDetailResponseDTO.ImageDTO.builder()
                            .id(img.getId())
                            .url(img.getUrl())
                            .build())
                    .collect(java.util.stream.Collectors.toList());
        }

        return CartDetailResponseDTO.builder()
                .id(cartDetail.getId())
                .cartId(cartDetail.getCart() != null ? cartDetail.getCart().getId() : null)
                .productDetailId(pd != null ? pd.getId() : null)
                .productName(pd != null && pd.getProduct() != null ? pd.getProduct().getName() : null)
                .productColor(colorName)
                .productSize(sizeName)
                .quantity(cartDetail.getQuantity())
                .availableQuantity(pd != null ? pd.getQuantity() : null)
                .price(unitPrice)
                .totalPrice(totalPrice)
                .images(imageDTOs)
                .createdAt(cartDetail.getCreatedAt())
                .updatedAt(cartDetail.getUpdatedAt())
                .build();
    }

    private CustomerInformationOnlineRequestDTO convertToCustomerInfoDTO(CustomerInformation info) {
        return CustomerInformationOnlineRequestDTO.builder()
                .name(info.getName())
                .phoneNumber(info.getPhoneNumber())
                .address(info.getAddress())
                .provinceId(info.getProvinceId())
                .districtId(info.getDistrictId())
                .wardCode(info.getWardCode())
                .build();
    }

    private BigDecimal calculateReductionAmount(Voucher voucher, BigDecimal total) {
        if (voucher == null || total == null) return ZERO;
        if (voucher.getType() == VoucherType.PERCENTAGE) {
            BigDecimal percentage = voucher.getPercentageDiscountValue() != null
                    ? voucher.getPercentageDiscountValue() : BigDecimal.ZERO;
            BigDecimal reduction = total.multiply(percentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountValue() != null && reduction.compareTo(voucher.getMaxDiscountValue()) > 0) {
                reduction = voucher.getMaxDiscountValue();
            }
            return reduction;
        } else {
            BigDecimal fixed = voucher.getFixedDiscountValue() != null ? voucher.getFixedDiscountValue() : BigDecimal.ZERO;
            return fixed.min(total);
        }
    }

    private void validateCustomerInformation(CustomerInformationOnlineRequestDTO dto) {
        if (dto == null) throw new RuntimeException("Thông tin địa chỉ không hợp lệ");
        if (dto.getName() == null || dto.getName().trim().isEmpty()) throw new RuntimeException("Tên không được để trống");
        if (dto.getPhoneNumber() == null || dto.getPhoneNumber().trim().isEmpty()) throw new RuntimeException("Số điện thoại không được để trống");
        if (dto.getAddress() == null || dto.getAddress().trim().isEmpty()) throw new RuntimeException("Địa chỉ không được để trống");
        if (dto.getDistrictId() == null || dto.getWardCode() == null) throw new RuntimeException("Thiếu thông tin quận/huyện hoặc phường/xã");
    }

    // ===== Implement missing interface methods =====
    @Override
    public BillResponseDTO createBillFromCart(Integer userId, Integer addressId, PaymentType paymentType, Integer voucherId) {
        // Delegate to existing 3-arg method; voucher application (if needed) can be handled later
        return createBillFromCart(userId, addressId, paymentType);
    }

    @Override
    public PaymentResponseDTO processOnlinePayment(Integer billId, PaymentType paymentType) {
        return billService.processPayment(billId, paymentType, null);
    }

    @Override
    public Page<BillResponseDTO> getUserBills(Integer userId, Pageable pageable) {
        Page<Bill> page = billRepository.findByCustomerIdAndDeletedFalse(userId, pageable);
        List<BillResponseDTO> dtos = page.getContent().stream()
                .map(billService::convertToBillResponseDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Override
    public void updateCustomerInformation(Integer billId, Integer addressId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        CustomerInformation info = customerInformationRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy địa chỉ"));
        bill.setCustomerInfor(info);
        bill.setCustomerName(info.getName());
        bill.setPhoneNumber(info.getPhoneNumber());
        bill.setAddress(info.getAddress());
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);
    }

    @Override
    public BillResponseDTO confirmOnlinePayment(Integer billId) {
        return billService.confirmBankingPayment(billId);
    }

    @Override
    public AccountVoucher applyBestUserVoucher(Integer userId, BigDecimal totalMoney) {
        // Minimal placeholder; real selection logic can be added later
        return null;
    }

    @Override
    public BigDecimal calculateShippingCost(Integer toDistrictId, String toWardCode, Integer weight, Integer length, Integer width, Integer height) {
        // Delegate to calculateShippingFee for backward compatibility
        return calculateShippingFee(toDistrictId, toWardCode, weight, length, width, height);
    }

    @Override
    public BigDecimal calculateShippingFee(Integer toDistrictId, String toWardCode, Integer weight, Integer length, Integer width, Integer height) {
        try {
            if (toDistrictId == null || toWardCode == null || toWardCode.isEmpty()) {
                throw new RuntimeException("Thiếu thông tin địa chỉ để tính phí vận chuyển");
            }
            // Build headers
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            // Build request body
            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("service_type_id", 2); // Express
            requestBody.put("from_district_id", 1444); // Default from district (shop)
            requestBody.put("to_district_id", toDistrictId);
            requestBody.put("to_ward_code", toWardCode);
            requestBody.put("height", height != null ? height : 10);
            requestBody.put("length", length != null ? length : 20);
            requestBody.put("weight", weight != null && weight > 0 ? weight : 1000);
            requestBody.put("width", width != null ? width : 20);
            requestBody.put("insurance_value", 0);

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = new org.springframework.http.HttpEntity<>(requestBody, headers);
            String url = ghnBaseUrl + "/v2/shipping-order/fee";

            org.springframework.http.ResponseEntity<java.util.Map<String, Object>> response = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.POST,
                    request,
                    new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {}
            );

            java.util.Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("data")) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> data = (java.util.Map<String, Object>) responseBody.get("data");
                Object totalObj = data.get("total");
                if (totalObj instanceof Number) {
                    BigDecimal fee = new BigDecimal(((Number) totalObj).toString());
                    return fee.setScale(2, RoundingMode.HALF_UP);
                }
            }
            throw new RuntimeException("Không thể tính phí vận chuyển từ GHN");
        } catch (Exception e) {
            LOGGER.error("Error calculating shipping fee via GHN: {}", e.getMessage());
            // Fallback to fixed cost if GHN fails
            return FIXED_SHIPPING_COST;
        }
    }

    private String getActor() {
        try {
            String username = SecurityContextHolder.getContext() != null &&
                    SecurityContextHolder.getContext().getAuthentication() != null
                    ? SecurityContextHolder.getContext().getAuthentication().getName()
                    : null;
            if (username == null || "anonymousUser".equalsIgnoreCase(username)) return "system";
            return username;
        } catch (Exception e) {
            return "system";
        }
    }
}
