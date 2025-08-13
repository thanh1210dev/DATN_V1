package com.example.datnmainpolo.service.Impl.BillDetailServiceImpl;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.VoucherDTO.VoucherResponseDTO;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.enums.ProductStatus;
import com.example.datnmainpolo.repository.BillDetailRepository;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import com.example.datnmainpolo.service.BillDetailService;
import com.example.datnmainpolo.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class BillDetailServiceImpl implements BillDetailService {
    private static final Logger logger = LoggerFactory.getLogger(BillDetailServiceImpl.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final BillDetailRepository billDetailRepository;
    private final BillRepository billRepository;
    private final ProductDetailRepository productDetailRepository;
    private final VoucherService voucherService;

    @Override
    @Transactional
    public BillDetailResponseDTO createBillDetail(Integer billId, BillDetailCreateDTO request) {
        logger.info("=== CREATE BILL DETAIL START ===");
        logger.info("Creating bill detail for bill {} with product {}", billId, request.getProductDetailId());
        if (request.getProductDetailId() == null) {
            throw new IllegalArgumentException("Thiếu productDetailId");
        }
        // Default quantity = 1 nếu null hoặc < 1
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            logger.warn("Quantity null hoặc <1 ({}), auto set = 1", request.getQuantity());
            request.setQuantity(1);
        }
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        logger.info("Found bill: ID={}, Code={}, Status={}", bill.getId(), bill.getCode(), bill.getStatus());

        Optional<BillDetail> existingDetail = billDetailRepository.findByBillIdAndDetailProduct_Id(billId, request.getProductDetailId());
        if (existingDetail.isPresent()) {
            BillDetail existing = existingDetail.get();
            if (existing.getDeleted()) {
                // For deleted items, reset quantity instead of adding to existing
                logger.info("Found deleted bill detail {}, resetting quantity to {} (was: {})", 
                    existing.getId(), request.getQuantity(), existing.getQuantity());
                return updateQuantity(existing.getId(), request.getQuantity());
            } else {
                // For active items, add to existing quantity
                logger.info("Found active bill detail {}, updating quantity from {} to {}", 
                    existing.getId(), existing.getQuantity(), 
                    existing.getQuantity() + request.getQuantity());
                return updateQuantity(existing.getId(), existing.getQuantity() + request.getQuantity());
            }
        }

        ProductDetail productDetail = productDetailRepository.findById(request.getProductDetailId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (productDetail.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Số lượng sản phẩm trong kho không đủ");
        }

        BillDetail billDetail = new BillDetail();
        billDetail.setBill(bill);
        billDetail.setDetailProduct(productDetail);
        billDetail.setQuantity(request.getQuantity());
        billDetail.setPrice(productDetail.getPrice() != null ? productDetail.getPrice() : ZERO);
        billDetail.setPromotionalPrice(productDetail.getPromotionalPrice());
    billDetail.setStatus(BillDetailStatus.PENDING);
        billDetail.setCreatedAt(Instant.now());
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setCreatedBy("system");
        billDetail.setUpdatedBy("system");
        billDetail.setDeleted(false);
        //trừ số lượng sản phẩm 
        productDetail.setQuantity(productDetail.getQuantity() - request.getQuantity());
        if (productDetail.getQuantity() <= 0) {
            productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            productDetail.setQuantity(0);
        }
        productDetailRepository.save(productDetail);

        BillDetail savedBillDetail = billDetailRepository.save(billDetail);
        logger.info("=== BILL DETAIL SAVED ===");
        logger.info("Saved bill detail: ID={}, BillID={}, ProductID={}, Quantity={}, Deleted={}", 
            savedBillDetail.getId(), savedBillDetail.getBill().getId(), 
            savedBillDetail.getDetailProduct().getId(), savedBillDetail.getQuantity(), savedBillDetail.getDeleted());

        updateBillTotal(bill, request.getQuantity(), productDetail);

        BillDetailResponseDTO response = buildBillDetailResponseDTO(savedBillDetail);
        logger.info("=== CREATE BILL DETAIL END ===");
        logger.info("Returning response for bill detail ID: {}", response.getId());
        return response;
    }

    @Override
    public PaginationResponse<BillDetailResponseDTO> getBillDetailsByBillId(Integer billId, int page, int size) {
        logger.info("=== GET BILL DETAILS START ===");
        logger.info("Fetching bill details for bill {}, page: {}, size: {}", billId, page, size);
        
        // First check all bill details (including deleted)
        List<BillDetail> allDetails = billDetailRepository.findByBillId(billId);
        logger.info("=== ALL BILL DETAILS (including deleted) ===");
        logger.info("Total bill details for bill {}: {}", billId, allDetails.size());
        allDetails.forEach(detail -> {
            logger.info("All details - ID={}, BillID={}, ProductID={}, Quantity={}, Deleted={}", 
                detail.getId(), detail.getBill().getId(), detail.getDetailProduct().getId(),
                detail.getQuantity(), detail.getDeleted());
        });
        
        // Then check only non-deleted
        List<BillDetail> nonDeletedList = billDetailRepository.findAllByBillIdAndDeletedFalse(billId);
        logger.info("=== NON-DELETED BILL DETAILS ===");
        logger.info("Non-deleted bill details for bill {}: {}", billId, nonDeletedList.size());
        nonDeletedList.forEach(detail -> {
            logger.info("Non-deleted - ID={}, BillID={}, ProductID={}, Quantity={}, Deleted={}", 
                detail.getId(), detail.getBill().getId(), detail.getDetailProduct().getId(),
                detail.getQuantity(), detail.getDeleted());
        });
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BillDetail> pageData = billDetailRepository.findByBillIdAndDeletedFalse(billId, pageable);
        logger.info("=== PAGINATED QUERY RESULT ===");
        logger.info("Found {} bill details for bill {} (paginated)", pageData.getTotalElements(), billId);
        
        // Debug: Log each bill detail with full context
        pageData.getContent().forEach(detail -> {
            logger.info("Paginated result - ID={}, BillID={}, ProductID={}, Quantity={}, Deleted={}, CreatedAt={}", 
                detail.getId(), detail.getBill().getId(), detail.getDetailProduct().getId(), 
                detail.getQuantity(), detail.getDeleted(), detail.getCreatedAt());
        });
        
        Page<BillDetailResponseDTO> dtoPage = pageData.map(this::buildBillDetailResponseDTO);
        logger.info("=== GET BILL DETAILS END ===");
        return new PaginationResponse<>(dtoPage);
    }

    @Override
    public List<BillDetailResponseDTO> getAllBillDetailsByBillId(Integer billId) {
        logger.debug("Fetching all bill details for bill {}", billId);
        List<BillDetail> billDetails = billDetailRepository.findAllByBillIdAndDeletedFalse(billId);
        return billDetails.stream().map(this::buildBillDetailResponseDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BillDetailResponseDTO addProductToBill(Integer billId, Integer productDetailId) {
        logger.info("=== ADD PRODUCT TO BILL START ===");
        logger.info("Adding product {} to bill {}", productDetailId, billId);
        BillDetailCreateDTO request = new BillDetailCreateDTO();
        request.setProductDetailId(productDetailId);
        request.setQuantity(1);
        BillDetailResponseDTO result = createBillDetail(billId, request);
        logger.info("=== ADD PRODUCT TO BILL END ===");
        logger.info("Added product to bill: BillDetailID={}, BillID={}, ProductID={}", 
            result.getId(), result.getBillId(), result.getProductDetailId());
        return result;
    }

    @Override
    @Transactional
    public BillDetailResponseDTO updateQuantity(Integer billDetailId, Integer quantity) {
        logger.info("=== UPDATE QUANTITY START ===");
        logger.info("Updating quantity for bill detail {} to {}", billDetailId, quantity);
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        ProductDetail productDetail = billDetail.getDetailProduct();
        Bill bill = billDetail.getBill();
        
        logger.info("Before update: BillDetail ID={}, BillID={}, Quantity={}, Deleted={}", 
            billDetail.getId(), billDetail.getBill().getId(), billDetail.getQuantity(), billDetail.getDeleted());

        // Check if this is a deleted item being reactivated
        boolean isReactivating = billDetail.getDeleted();
        int quantityChange;
        
        if (isReactivating) {
            // For deleted items being reactivated, treat the entire quantity as new addition
            quantityChange = quantity;
            logger.info("Reactivating deleted bill detail - treating full quantity {} as new addition", quantity);
        } else {
            // For normal updates, calculate the difference
            quantityChange = quantity - billDetail.getQuantity();
            logger.info("Normal quantity update - change: {}", quantityChange);
        }

        if (productDetail.getQuantity() < quantityChange) {
            throw new RuntimeException("Số lượng sản phẩm trong kho không đủ");
        }

        productDetail.setQuantity(productDetail.getQuantity() - quantityChange);
        if (productDetail.getQuantity() <= 0) {
            productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            productDetail.setQuantity(0);
        }
        productDetailRepository.save(productDetail);

        billDetail.setQuantity(quantity);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("system");
        // CRITICAL FIX: Reset deleted flag to false when updating quantity
        billDetail.setDeleted(false);

        BillDetail savedBillDetail = billDetailRepository.save(billDetail);
        logger.info("=== BILL DETAIL UPDATED ===");
        logger.info("After update: BillDetail ID={}, BillID={}, Quantity={}, Deleted={}", 
            savedBillDetail.getId(), savedBillDetail.getBill().getId(), savedBillDetail.getQuantity(), savedBillDetail.getDeleted());

        // Update bill total with the correct quantity change
        if (isReactivating) {
            // For reactivated items, add the full amount to bill total
            updateBillTotal(bill, quantity, productDetail);
            logger.info("Updated bill total for reactivated item - added full quantity: {}", quantity);
        } else {
            // For normal updates, add/subtract the difference
            updateBillTotal(bill, quantityChange, productDetail);
            logger.info("Updated bill total for normal update - quantity change: {}", quantityChange);
        }
        
        // Check voucher validity after quantity change
        validateVoucherAfterBillChange(bill);
        
        // Verify the bill detail can be found immediately after save
        logger.info("=== VERIFICATION CHECK ===");
        List<BillDetail> allBillDetails = billDetailRepository.findByBillId(bill.getId());
        logger.info("Total bill details for bill {}: {}", bill.getId(), allBillDetails.size());
        allBillDetails.forEach(detail -> {
            logger.info("Found bill detail: ID={}, BillID={}, Quantity={}, Deleted={}", 
                detail.getId(), detail.getBill().getId(), detail.getQuantity(), detail.getDeleted());
        });
        
        List<BillDetail> nonDeletedDetails = billDetailRepository.findAllByBillIdAndDeletedFalse(bill.getId());
        logger.info("Non-deleted bill details for bill {}: {}", bill.getId(), nonDeletedDetails.size());
        
        logger.info("=== UPDATE QUANTITY END ===");
        return buildBillDetailResponseDTO(savedBillDetail);
    }

    @Override
    @Transactional
    public void deleteBillDetail(Integer billDetailId) {
        logger.info("=== DELETE BILL DETAIL START ===");
        logger.info("Deleting bill detail {}", billDetailId);
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        Bill bill = billDetail.getBill();
        ProductDetail productDetail = billDetail.getDetailProduct();

        logger.info("Before deletion: Bill ID={}, TotalMoney={}, ReductionAmount={}, FinalAmount={}, VoucherCode={}", 
            bill.getId(), bill.getTotalMoney(), bill.getReductionAmount(), bill.getFinalAmount(), bill.getVoucherCode());

        // Restore product quantity
        productDetail.setQuantity(productDetail.getQuantity() + billDetail.getQuantity());
        if (productDetail.getQuantity() > 0) {
            productDetail.setStatus(ProductStatus.AVAILABLE);
        }
        productDetailRepository.save(productDetail);

        // Update bill total money
        BigDecimal totalPrice = calculateTotalPrice(billDetail);
        bill.setTotalMoney(bill.getTotalMoney() != null ? bill.getTotalMoney().subtract(totalPrice) : ZERO);
        
        // Check if voucher is still valid after removing item
        if (bill.getVoucherCode() != null && !bill.getVoucherCode().isEmpty()) {
            validateVoucherAfterBillChange(bill);
        }
        
        // Recalculate final amount
        bill.setFinalAmount(calculateFinalAmount(bill));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);

        // Mark bill detail as deleted
        billDetail.setDeleted(true);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("system");
        billDetailRepository.save(billDetail);
        
        logger.info("After deletion: Bill ID={}, TotalMoney={}, ReductionAmount={}, FinalAmount={}, VoucherCode={}", 
            bill.getId(), bill.getTotalMoney(), bill.getReductionAmount(), bill.getFinalAmount(), bill.getVoucherCode());
        logger.info("=== DELETE BILL DETAIL END ===");
    }
    
    /**
     * Validate voucher after bill changes (quantity update or item deletion)
     */
    private void validateVoucherAfterBillChange(Bill bill) {
        if (bill.getVoucherCode() == null || bill.getVoucherCode().isEmpty()) {
            return;
        }
        
        BigDecimal currentTotalMoney = bill.getTotalMoney();
        logger.info("Validating voucher {} after bill change. Current total: {}", bill.getVoucherCode(), currentTotalMoney);
        
        // Check if voucher should be removed
        if (shouldRemoveVoucherAfterBillChange(bill, currentTotalMoney)) {
            logger.warn("Voucher {} no longer valid after bill change. Removing voucher.", bill.getVoucherCode());
            bill.setVoucherCode(null);
            bill.setReductionAmount(ZERO);
            // Recalculate final amount without voucher
            bill.setFinalAmount(calculateFinalAmount(bill));
            billRepository.save(bill);
        }
    }
    
    /**
     * Check if voucher should be removed after bill total changes
     * This is a comprehensive check for voucher validity
     */
    private boolean shouldRemoveVoucherAfterBillChange(Bill bill, BigDecimal newTotalMoney) {
        // If reduction amount is greater than new total, definitely remove voucher
        if (bill.getReductionAmount() != null && bill.getReductionAmount().compareTo(newTotalMoney) > 0) {
            logger.info("Voucher reduction {} exceeds new total {}, removing voucher", 
                bill.getReductionAmount(), newTotalMoney);
            return true;
        }
        
        // If total money becomes zero or negative, remove voucher
        if (newTotalMoney.compareTo(ZERO) <= 0) {
            logger.info("Bill total is zero or negative {}, removing voucher", newTotalMoney);
            return true;
        }
        
        // Check voucher validity using VoucherService
        try {
            // For public vouchers, userId can be null
            Integer userId = bill.getCustomer() != null ? bill.getCustomer().getId() : null;
            VoucherResponseDTO voucher = voucherService.getVoucherByCodeForUser(bill.getVoucherCode(), userId, newTotalMoney);
            
            if (voucher == null) {
                logger.info("Voucher {} is no longer valid for total {}", bill.getVoucherCode(), newTotalMoney);
                return true;
            }
            
            // Check minimum order value
            if (voucher.getMinOrderValue() != null && newTotalMoney.compareTo(voucher.getMinOrderValue()) < 0) {
                logger.info("New total {} is below minimum order value {} for voucher {}", 
                    newTotalMoney, voucher.getMinOrderValue(), bill.getVoucherCode());
                return true;
            }
            
            return false;
            
        } catch (Exception e) {
            logger.error("Error validating voucher {}: {}", bill.getVoucherCode(), e.getMessage());
            // If there's an error validating voucher, remove it to be safe
            return true;
        }
    }

    @Transactional
    // updateBillDetailTypeOrder removed with typeOrder deprecation

    private void updateBillTotal(Bill bill, int quantityChange, ProductDetail productDetail) {
        logger.info("=== UPDATE BILL TOTAL START ===");
        logger.info("Updating bill {} total with quantity change {}", bill.getId(), quantityChange);
        
        BigDecimal price = productDetail.getPromotionalPrice() != null
                ? productDetail.getPromotionalPrice()
                : productDetail.getPrice() != null ? productDetail.getPrice() : ZERO;
        logger.info("Using price: {} (promotional: {}, regular: {})", 
            price, productDetail.getPromotionalPrice(), productDetail.getPrice());
            
        BigDecimal totalPriceChange = price.multiply(BigDecimal.valueOf(quantityChange));
        logger.info("Total price change: {} (price {} × quantity change {})", 
            totalPriceChange, price, quantityChange);

        BigDecimal currentTotal = bill.getTotalMoney() != null ? bill.getTotalMoney() : ZERO;
        BigDecimal newTotal = currentTotal.add(totalPriceChange);
        logger.info("Bill total: {} → {} (change: {})", currentTotal, newTotal, totalPriceChange);
        
        bill.setTotalMoney(newTotal);
        bill.setFinalAmount(calculateFinalAmount(bill));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);
        
        logger.info("=== UPDATE BILL TOTAL END ===");
        logger.info("Final amounts - Total: {}, Final: {}", bill.getTotalMoney(), bill.getFinalAmount());
    }

    private BigDecimal calculateTotalPrice(BillDetail billDetail) {
        BigDecimal price = billDetail.getPromotionalPrice() != null
                ? billDetail.getPromotionalPrice()
                : billDetail.getPrice() != null ? billDetail.getPrice() : ZERO;
        return price.multiply(BigDecimal.valueOf(billDetail.getQuantity()));
    }

    private BigDecimal calculateFinalAmount(Bill bill) {
        BigDecimal totalMoney = bill.getTotalMoney() != null ? bill.getTotalMoney() : ZERO;
        BigDecimal reductionAmount = bill.getReductionAmount() != null ? bill.getReductionAmount() : ZERO;
        BigDecimal moneyShip = bill.getMoneyShip() != null ? bill.getMoneyShip() : ZERO;
        return totalMoney.subtract(reductionAmount).add(moneyShip);
    }

    private BillDetailResponseDTO buildBillDetailResponseDTO(BillDetail billDetail) {
        BigDecimal totalPrice = calculateTotalPrice(billDetail);
        return BillDetailResponseDTO.builder()
                .id(billDetail.getId())
                .billId(billDetail.getBill().getId())
                .billCode(billDetail.getBill().getCode())
                .productDetailId(billDetail.getDetailProduct().getId())
                .productDetailCode(billDetail.getDetailProduct().getCode())
                .productName(billDetail.getDetailProduct().getProduct().getName())
                .productColor(billDetail.getDetailProduct().getColor().getName())
                .productSize(billDetail.getDetailProduct().getSize().getName())
                .productImage(billDetail.getDetailProduct().getImages() != null
                        && !billDetail.getDetailProduct().getImages().isEmpty()
                        ? billDetail.getDetailProduct().getImages().stream()
                        .map(img -> BillDetailResponseDTO.ImageDTO.builder()
                                .id(img.getId())
                                .url(img.getUrl())
                                .build())
                        .collect(Collectors.toList())
                        : null)
                .price(billDetail.getPrice())
                .promotionalPrice(billDetail.getPromotionalPrice())
                .quantity(billDetail.getQuantity())
                .totalPrice(totalPrice)
                .status(billDetail.getStatus())
                .createdAt(billDetail.getCreatedAt())
                .updatedAt(billDetail.getUpdatedAt())
                .createdBy(billDetail.getCreatedBy())
                .updatedBy(billDetail.getUpdatedBy())
                .build();
    }
}