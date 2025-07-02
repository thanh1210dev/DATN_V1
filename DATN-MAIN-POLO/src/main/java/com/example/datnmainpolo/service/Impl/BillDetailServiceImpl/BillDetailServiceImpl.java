package com.example.datnmainpolo.service.Impl.BillDetailServiceImpl;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.enums.OrderStatus;
import com.example.datnmainpolo.enums.ProductStatus;
import com.example.datnmainpolo.repository.BillDetailRepository;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import com.example.datnmainpolo.service.BillDetailService;
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

    @Override
    @Transactional
    public BillDetailResponseDTO createBillDetail(Integer billId, BillDetailCreateDTO request) {
        logger.info("Creating bill detail for bill {} with product {}", billId, request.getProductDetailId());
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        Optional<BillDetail> existingDetail = billDetailRepository.findByBillIdAndDetailProduct_Id(billId, request.getProductDetailId());
        if (existingDetail.isPresent()) {
            return updateQuantity(existingDetail.get().getId(), existingDetail.get().getQuantity() + request.getQuantity());
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
        billDetail.setTypeOrder(OrderStatus.PENDING); // Initialize typeOrder
        billDetail.setCreatedAt(Instant.now());
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setCreatedBy("system");
        billDetail.setUpdatedBy("system");
        billDetail.setDeleted(false);

        productDetail.setQuantity(productDetail.getQuantity() - request.getQuantity());
        if (productDetail.getQuantity() <= 0) {
            productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            productDetail.setQuantity(0);
        }
        productDetailRepository.save(productDetail);

        BillDetail savedBillDetail = billDetailRepository.save(billDetail);

        updateBillTotal(bill, request.getQuantity(), productDetail);

        return buildBillDetailResponseDTO(savedBillDetail);
    }

    @Override
    public PaginationResponse<BillDetailResponseDTO> getBillDetailsByBillId(Integer billId, int page, int size) {
        logger.debug("Fetching bill details for bill {}, page: {}, size: {}", billId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<BillDetail> pageData = billDetailRepository.findByBillIdAndDeletedFalse(billId, pageable);
        Page<BillDetailResponseDTO> dtoPage = pageData.map(this::buildBillDetailResponseDTO);
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
        logger.info("Adding product {} to bill {}", productDetailId, billId);
        BillDetailCreateDTO request = new BillDetailCreateDTO();
        request.setProductDetailId(productDetailId);
        request.setQuantity(1);
        return createBillDetail(billId, request);
    }

    @Override
    @Transactional
    public BillDetailResponseDTO updateQuantity(Integer billDetailId, Integer quantity) {
        logger.info("Updating quantity for bill detail {} to {}", billDetailId, quantity);
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        ProductDetail productDetail = billDetail.getDetailProduct();
        Bill bill = billDetail.getBill();

        int quantityChange = quantity - billDetail.getQuantity();

        if (productDetail.getQuantity() < quantityChange) {
            throw new RuntimeException("Số lượng sản phẩm trong kho không đủ");
        }

        int oldQuantity = billDetail.getQuantity();
        productDetail.setQuantity(productDetail.getQuantity() - quantityChange);
        if (productDetail.getQuantity() <= 0) {
            productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            productDetail.setQuantity(0);
        }
        productDetailRepository.save(productDetail);

        billDetail.setQuantity(quantity);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("system");

        BillDetail savedBillDetail = billDetailRepository.save(billDetail);

        updateBillTotal(bill, quantity - oldQuantity, productDetail);

        return buildBillDetailResponseDTO(savedBillDetail);
    }

    @Override
    @Transactional
    public void deleteBillDetail(Integer billDetailId) {
        logger.info("Deleting bill detail {}", billDetailId);
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        Bill bill = billDetail.getBill();
        ProductDetail productDetail = billDetail.getDetailProduct();

        productDetail.setQuantity(productDetail.getQuantity() + billDetail.getQuantity());
        if (productDetail.getQuantity() > 0) {
            productDetail.setStatus(ProductStatus.AVAILABLE);
        }
        productDetailRepository.save(productDetail);

        BigDecimal totalPrice = calculateTotalPrice(billDetail);
        bill.setTotalMoney(bill.getTotalMoney() != null ? bill.getTotalMoney().subtract(totalPrice) : ZERO);
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);

        billDetail.setDeleted(true);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("system");
        billDetailRepository.save(billDetail);
    }

    @Transactional
    public void updateBillDetailTypeOrder(Integer billId, OrderStatus typeOrder) {
        logger.info("Updating typeOrder to {} for all bill details of bill {}", typeOrder, billId);
        List<BillDetail> billDetails = billDetailRepository.findByBillId(billId);
        for (BillDetail detail : billDetails) {
            detail.setTypeOrder(typeOrder);
            detail.setUpdatedAt(Instant.now());
            detail.setUpdatedBy("system");
            billDetailRepository.save(detail);
        }
    }

    private void updateBillTotal(Bill bill, int quantityChange, ProductDetail productDetail) {
        logger.debug("Updating bill {} total with quantity change {}", bill.getId(), quantityChange);
        BigDecimal price = productDetail.getPromotionalPrice() != null
                ? productDetail.getPromotionalPrice()
                : productDetail.getPrice() != null ? productDetail.getPrice() : ZERO;
        BigDecimal totalPriceChange = price.multiply(BigDecimal.valueOf(quantityChange));

        BigDecimal currentTotal = bill.getTotalMoney() != null ? bill.getTotalMoney() : ZERO;
        bill.setTotalMoney(currentTotal.add(totalPriceChange));
        bill.setFinalAmount(calculateFinalAmount(bill));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);
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
                .typeOrder(billDetail.getTypeOrder())
                .createdAt(billDetail.getCreatedAt())
                .updatedAt(billDetail.getUpdatedAt())
                .createdBy(billDetail.getCreatedBy())
                .updatedBy(billDetail.getUpdatedBy())
                .build();
    }
}