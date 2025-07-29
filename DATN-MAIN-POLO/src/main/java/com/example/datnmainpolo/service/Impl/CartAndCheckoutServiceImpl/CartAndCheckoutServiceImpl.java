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
        System.out.println("User ID: " + userId + ", Product Detail ID: " + productDetailId + ", Quantity: " + quantity);
        
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
        System.out.println("=== ADD TO CART DEBUG END - Cart detail saved with ID: " + savedCartDetail.getId() + " ===");
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
        
        LOGGER.info("Creating bill from cart for user {} with payment type {} and address {}", userId, paymentType, addressId);

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
        
        // Tính phí vận chuyển thực tế dựa trên thông tin địa chỉ và tổng khối lượng sản phẩm
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
                30,  // length - chiều dài mặc định
                20,  // width - chiều rộng mặc định
                10   // height - chiều cao mặc định
            );
        } catch (Exception e) {
            LOGGER.error("Lỗi khi tính phí vận chuyển cho hóa đơn mới: {}", e.getMessage());
            try {
                // Thử lại với các giá trị mặc định khác nếu có lỗi
                LOGGER.info("Thử lại tính phí vận chuyển với giá trị mặc định");
                shippingFee = calculateShippingFee(
                    customerInfo.getDistrictId(),
                    customerInfo.getWardCode(),
                    500,  // weight mặc định 500g
                    30,   // length
                    20,   // width
                    10    // height
                );
            } catch (Exception ex) {
                LOGGER.error("Không thể tính phí vận chuyển, sử dụng giá trị cố định: {}", ex.getMessage());
                shippingFee = FIXED_SHIPPING_COST;  // Chỉ dùng cố định khi thực sự không tính được
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

        // Clear cart only for COD payment - VNPAY will clear cart after successful callback
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
        
        // Tính phí vận chuyển dựa trên địa chỉ mới
        // Lấy tổng khối lượng từ các chi tiết hóa đơn
        Integer totalWeight = 0;
        List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
        
        // Tính tổng khối lượng (giả sử mỗi sản phẩm có khối lượng 500g)
        for (BillDetail detail : billDetails) {
            totalWeight += 500 * detail.getQuantity();
        }
        
        // Nếu không có sản phẩm hoặc tổng khối lượng quá nhỏ
        if (totalWeight <= 0) {
            totalWeight = 500;
        }
        
        // Tính phí vận chuyển mới
        BigDecimal shippingFee;
        try {
            // Kiểm tra các giá trị đầu vào trước khi gọi API
            if (customerInfo.getDistrictId() == null || customerInfo.getWardCode() == null) {
                LOGGER.warn("Thiếu thông tin quận/huyện hoặc phường/xã, sử dụng phí vận chuyển mặc định");
                shippingFee = FIXED_SHIPPING_COST;
            } else {
                LOGGER.info("Tính lại phí vận chuyển khi cập nhật địa chỉ cho hóa đơn {}", billId);
                shippingFee = calculateShippingFee(
                    customerInfo.getDistrictId(),
                    customerInfo.getWardCode(),
                    totalWeight,
                    30,  // length
                    20,  // width
                    10   // height
                );
                LOGGER.info("Phí vận chuyển mới: {} VND", shippingFee);
            }
        } catch (Exception e) {
            LOGGER.error("Lỗi khi tính phí vận chuyển khi cập nhật địa chỉ: {}", e.getMessage());
            try {
                // Thử lại với giá trị mặc định
                LOGGER.info("Thử lại tính phí vận chuyển với giá trị mặc định");
                shippingFee = calculateShippingFee(
                    customerInfo.getDistrictId(),
                    customerInfo.getWardCode(),
                    500,  // weight mặc định 500g
                    30,   // length
                    20,   // width
                    10    // height
                );
            } catch (Exception ex) {
                LOGGER.error("Thử lại không thành công, sử dụng phí cố định: {}", ex.getMessage());
                shippingFee = FIXED_SHIPPING_COST;  // Chỉ dùng cố định khi thực sự không tính được
            }
        }
        
        bill.setMoneyShip(shippingFee);

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
    public PaymentResponseDTO processOnlinePayment(Integer billId, PaymentType paymentType) {
        LOGGER.info("Processing online payment for bill {} with type {}", billId, paymentType);

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        if (bill.getCustomerInfor() == null) {
            throw new RuntimeException("Vui lòng cung cấp thông tin giao hàng trước khi thanh toán");
        }

        if (paymentType != PaymentType.BANKING && paymentType != PaymentType.VNPAY && paymentType != PaymentType.COD) {
            throw new RuntimeException("Phương thức thanh toán không được hỗ trợ");
        }

        // Không cần cập nhật trạng thái bill thủ công cho COD nữa
        // Gọi xử lý thanh toán (đã có COD riêng trong BillServiceImpl)
        return billService.processPayment(billId, paymentType, null);
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
        LOGGER.info("Gọi tính phí vận chuyển động thông qua API GHN cho quận/huyện {} và phường/xã {}", toDistrictId, toWardCode);
        try {
            return calculateShippingFee(toDistrictId, toWardCode, weight, length, width, height);
        } catch (Exception e) {
            LOGGER.error("Lỗi khi tính phí vận chuyển: {}", e.getMessage());
            // Vẫn sử dụng API để tính phí, không dùng phí cố định
            try {
                // Thử lại với giá trị mặc định
                return calculateShippingFee(toDistrictId, toWardCode, 500, 30, 20, 10);
            } catch (Exception ex) {
                LOGGER.error("Lỗi khi thử lại tính phí vận chuyển, sử dụng phí cố định: {}", ex.getMessage());
                return FIXED_SHIPPING_COST; // Chỉ sử dụng phí cố định khi tất cả các cách đều thất bại
            }
        }
    }
    
    @Override
    @Transactional
    public BigDecimal calculateShippingFee(Integer toDistrictId, String toWardCode, Integer weight, Integer length, Integer width, Integer height) {
        LOGGER.info("Tính phí vận chuyển cho quận/huyện {} và phường/xã {} với khối lượng {}", toDistrictId, toWardCode, weight);
        
        // Kiểm tra dữ liệu đầu vào
        if (toDistrictId == null || toWardCode == null || weight == null) {
            LOGGER.warn("Thiếu thông tin địa chỉ hoặc khối lượng, sử dụng phí cố định");
            return FIXED_SHIPPING_COST;
        }
        
        try {
            // Sử dụng HttpHeaders từ org.springframework.http để tránh import
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            
            // Kiểm tra token từ cấu hình application.yml
            if (ghnToken == null || ghnToken.isEmpty()) {
                LOGGER.error("GHN API Token không được cấu hình hoặc rỗng");
                return FIXED_SHIPPING_COST;
            }
            headers.set("Token", ghnToken);
            LOGGER.debug("Sử dụng GHN token: {}", ghnToken);
            
            // Kiểm tra Shop ID từ cấu hình application.yml
            if (shopId == null || shopId.isEmpty()) {
                LOGGER.error("GHN Shop ID không được cấu hình hoặc rỗng");
                return FIXED_SHIPPING_COST;
            }
            headers.set("ShopId", shopId);
            LOGGER.debug("Sử dụng GHN Shop ID: {}", shopId);
            
            headers.set("Content-Type", "application/json");

            // Quận/huyện của cửa hàng
            Integer fromDistrictId = 1444; // Mặc định là Quận Hai Bà Trưng, Hà Nội
            String fromDistrictIdEnv = System.getenv("GHN_FROM_DISTRICT_ID");
            if (fromDistrictIdEnv != null && !fromDistrictIdEnv.isEmpty()) {
                try {
                    fromDistrictId = Integer.parseInt(fromDistrictIdEnv);
                } catch (NumberFormatException e) {
                    LOGGER.warn("Không thể parse GHN_FROM_DISTRICT_ID: {}", fromDistrictIdEnv);
                }
            }

            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("service_type_id", 2);
            requestBody.put("from_district_id", fromDistrictId);
            requestBody.put("to_district_id", toDistrictId);
            requestBody.put("to_ward_code", toWardCode);
            requestBody.put("height", height != null ? height : 10);
            requestBody.put("length", length != null ? length : 30);
            requestBody.put("weight", weight != null ? weight : 500);
            requestBody.put("width", width != null ? width : 20);
            requestBody.put("insurance_value", 0);
            
            // Log chi tiết request để debug
            LOGGER.debug("Request body cho GHN API: {}", requestBody);

            org.springframework.http.HttpEntity<java.util.Map<String, Object>> request = 
                new org.springframework.http.HttpEntity<>(requestBody, headers);
                
            // Sử dụng base URL từ cấu hình
            String url;
            if (ghnBaseUrl != null && !ghnBaseUrl.isEmpty()) {
                // Đảm bảo sử dụng gateway production, không phải dev
                if (ghnBaseUrl.contains("dev-online-gateway")) {
                    url = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee";
                    LOGGER.warn("Chuyển đổi URL từ dev sang production: {}", url);
                } else {
                    url = ghnBaseUrl + "/v2/shipping-order/fee";
                    LOGGER.debug("Sử dụng base URL từ cấu hình: {}", ghnBaseUrl);
                }
            } else {
                url = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee";
                LOGGER.warn("Không tìm thấy cấu hình ghnBaseUrl, sử dụng URL production mặc định");
            }
            
            // Định nghĩa các phí vận chuyển dự phòng dựa trên khoảng cách
            // Mô phỏng giá tiền gần đúng: khối lượng dưới 1kg, khoảng cách dưới 10km
            BigDecimal fallbackFee = FIXED_SHIPPING_COST; // Mặc định: 22,000 VND
            
            if (toDistrictId != null) {
                // Phân loại quận/huyện theo khoảng cách để ước tính phí ship
                // Các ID quận/huyện của Hà Nội - giả định cửa hàng ở Hà Nội
                boolean isHanoi = toDistrictId >= 1442 && toDistrictId <= 1482; // Quận/huyện Hà Nội
                boolean isHCM = toDistrictId >= 1442 && toDistrictId <= 1482; // Quận/huyện TP.HCM
                
                // Tính phí vận chuyển dự phòng dựa trên khối lượng và khoảng cách
                Integer safeWeight = (weight != null && weight > 0) ? weight : 500;
                
                if (isHanoi) {
                    // Nội thành Hà Nội
                    fallbackFee = new BigDecimal(18000 + (safeWeight / 500) * 3000).setScale(2, RoundingMode.HALF_UP);
                } else if (isHCM) {
                    // Nội thành TP.HCM
                    fallbackFee = new BigDecimal(25000 + (safeWeight / 500) * 4000).setScale(2, RoundingMode.HALF_UP);
                } else {
                    // Tỉnh/thành phố khác
                    fallbackFee = new BigDecimal(35000 + (safeWeight / 500) * 5000).setScale(2, RoundingMode.HALF_UP);
                }
                
                // Giới hạn phí vận chuyển tối đa
                if (fallbackFee.compareTo(new BigDecimal(150000)) > 0) {
                    fallbackFee = new BigDecimal(150000).setScale(2, RoundingMode.HALF_UP);
                }
                
                LOGGER.info("Phí vận chuyển dự phòng được tính: {} VND", fallbackFee);
            }

            // Thiết lập timeout cho request
            org.springframework.http.client.SimpleClientHttpRequestFactory factory = 
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(5000);
            factory.setReadTimeout(5000);
            
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            restTemplate.setRequestFactory(factory);
            
            LOGGER.info("Đang gửi yêu cầu đến GHN API: {}", url);
            
            try {
                @SuppressWarnings("rawtypes") // Suppressing warning about raw type
                org.springframework.http.ResponseEntity<java.util.Map> response = 
                    restTemplate.exchange(url, org.springframework.http.HttpMethod.POST, request, 
                                        java.util.Map.class);
                    
                @SuppressWarnings("unchecked") // Suppressing warning about raw type
                java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
                LOGGER.debug("GHN API response: {}", responseBody);

                if (responseBody != null && responseBody.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> data = (java.util.Map<String, Object>) responseBody.get("data");
                    if (data != null && data.containsKey("total")) {
                        Object totalObj = data.get("total");
                        if (totalObj instanceof Integer) {
                            Integer fee = (Integer) totalObj;
                            LOGGER.info("Phí vận chuyển tính được: {} VND", fee);
                            return new java.math.BigDecimal(fee).setScale(2, java.math.RoundingMode.HALF_UP);
                        } else if (totalObj instanceof Number) {
                            Number feeNumber = (Number) totalObj;
                            LOGGER.info("Phí vận chuyển tính được (không phải Integer): {} VND", feeNumber);
                            return new java.math.BigDecimal(feeNumber.doubleValue()).setScale(2, java.math.RoundingMode.HALF_UP);
                        } else if (totalObj instanceof String) {
                            try {
                                double feeDouble = Double.parseDouble((String) totalObj);
                                LOGGER.info("Phí vận chuyển tính được (từ String): {} VND", feeDouble);
                                return new java.math.BigDecimal(feeDouble).setScale(2, java.math.RoundingMode.HALF_UP);
                            } catch (NumberFormatException e) {
                                LOGGER.warn("Không thể chuyển đổi String thành số: {}", totalObj);
                            }
                        }
                    }
                }
                
                LOGGER.warn("GHN API không trả về dữ liệu phí vận chuyển hợp lệ, sử dụng phí cố định");
            } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized unauthorizedEx) {
                LOGGER.error("Lỗi xác thực với GHN API (401 Unauthorized). Token hết hạn hoặc không hợp lệ: {}", unauthorizedEx.getMessage());
                LOGGER.info("Token hiện tại: {}, Shop ID: {}", ghnToken, shopId);
                // Cố gắng sử dụng token thay thế từ application.yml
                try {
                    String backupToken = "929e80d4-51a7-11f0-8820-9ad08323835f"; // Token từ application.yml
                    LOGGER.info("Thử lại với token dự phòng từ application.yml");
                    headers.set("Token", backupToken);
                    
                    org.springframework.http.HttpEntity<java.util.Map<String, Object>> retryRequest = 
                        new org.springframework.http.HttpEntity<>(requestBody, headers);
                    
                    @SuppressWarnings("rawtypes")
                    org.springframework.http.ResponseEntity<java.util.Map> retryResponse = 
                        restTemplate.exchange(url, org.springframework.http.HttpMethod.POST, retryRequest, 
                                            java.util.Map.class);
                                            
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> retryResponseBody = (java.util.Map<String, Object>) retryResponse.getBody();
                    
                    if (retryResponseBody != null && retryResponseBody.containsKey("data")) {
                        @SuppressWarnings("unchecked")
                        java.util.Map<String, Object> data = (java.util.Map<String, Object>) retryResponseBody.get("data");
                        if (data != null && data.containsKey("total")) {
                            Integer fee = (Integer) data.get("total");
                            LOGGER.info("Phí vận chuyển tính được với token dự phòng: {} VND", fee);
                            return new java.math.BigDecimal(fee).setScale(2, java.math.RoundingMode.HALF_UP);
                        }
                    }
                } catch (Exception retryEx) {
                    LOGGER.error("Thử lại với token dự phòng cũng thất bại: {}", retryEx.getMessage());
                }
            } catch (Exception e) {
                LOGGER.error("Lỗi gọi GHN API: {}", e.getMessage());
            }
            return FIXED_SHIPPING_COST;
        } catch (Exception e) {
            LOGGER.error("Lỗi khi tính phí vận chuyển: {}", e.getMessage(), e);
            
            // Trong trường hợp lỗi, trả về phí vận chuyển cố định
            return FIXED_SHIPPING_COST;
        }
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

    private void validateCustomerInformation(CustomerInformationOnlineRequestDTO customerInfo) {
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

    private CustomerInformationOnlineRequestDTO convertToCustomerInfoDTO(CustomerInformation customerInfo) {
        return CustomerInformationOnlineRequestDTO.builder()
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
                .availableQuantity(productDetail.getQuantity()) // Thêm số lượng tồn kho
                .price(price)
                .totalPrice(totalPrice)
                .images(images)
                .createdAt(cartDetail.getCreatedAt())
                .updatedAt(cartDetail.getUpdatedAt())
                .build();
    }
}