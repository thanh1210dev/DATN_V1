package com.example.datnmainpolo.service.Impl.BillDetailServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorRequestDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.Color;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.enums.BillDetailStatus;
import com.example.datnmainpolo.enums.ProductStatus;
import com.example.datnmainpolo.repository.BillDetailRepository;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import com.example.datnmainpolo.service.BillDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillDetailServiceImpl implements BillDetailService {
    private final BillDetailRepository billDetailRepository;
    private final BillRepository billRepository;
    private final ProductDetailRepository productDetailRepository;

    @Override
    @Transactional
    public BillDetailResponseDTO createBillDetail(Integer billId, BillDetailCreateDTO request) {
        // Kiểm tra bill tồn tại
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        // Kiểm tra product detail tồn tại
        ProductDetail productDetail = productDetailRepository.findById(request.getProductDetailId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        // Tạo bill detail mới
        BillDetail billDetail = new BillDetail();
        billDetail.setBill(bill);
        billDetail.setDetailProduct(productDetail);
        billDetail.setQuantity(request.getQuantity());
        billDetail.setPrice(productDetail.getPrice());
        billDetail.setPromotionalPrice(productDetail.getPromotionalPrice());
        billDetail.setStatus(BillDetailStatus.PENDING);
        billDetail.setCreatedAt(Instant.now());
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setCreatedBy("system"); // Sau này sẽ lấy từ SecurityContextHolder
        billDetail.setUpdatedBy("system");
        billDetail.setDeleted(false);

        // Lưu bill detail
        BillDetail savedBillDetail = billDetailRepository.save(billDetail);

        // Trả về response
        return BillDetailResponseDTO.builder()
                .id(savedBillDetail.getId())
                .billId(savedBillDetail.getBill().getId())
                .billCode(savedBillDetail.getBill().getCode())
                .productDetailId(savedBillDetail.getDetailProduct().getId())
                .productName(savedBillDetail.getDetailProduct().getProduct().getName())
                .productColor(savedBillDetail.getDetailProduct().getColor().getName())
                .productSize(savedBillDetail.getDetailProduct().getSize().getName())
                .productImage(
                        savedBillDetail.getDetailProduct().getImages() != null
                                && !savedBillDetail.getDetailProduct().getImages().isEmpty()
                                        ? savedBillDetail.getDetailProduct().getImages().get(0).getUrl()
                                        : null)
                .price(savedBillDetail.getPrice())
                .promotionalPrice(savedBillDetail.getPromotionalPrice())
                .quantity(savedBillDetail.getQuantity())
                .totalPrice(
                        savedBillDetail.getPromotionalPrice() != null
                                ? savedBillDetail.getPromotionalPrice()
                                        .multiply(BigDecimal.valueOf(savedBillDetail.getQuantity()))
                                : savedBillDetail.getPrice()
                                        .multiply(BigDecimal.valueOf(savedBillDetail.getQuantity())))
                .status(savedBillDetail.getStatus())
                .createdAt(savedBillDetail.getCreatedAt())
                .updatedAt(savedBillDetail.getUpdatedAt())
                .createdBy(savedBillDetail.getCreatedBy())
                .updatedBy(savedBillDetail.getUpdatedBy())
                .build();
    }

    @Override
    public PaginationResponse<BillDetailResponseDTO> getBillDetailsByBillId(Integer billId, int page, int size) {
        // Tạo Pageable
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending());

        // Tìm kiếm bill details
        Page<BillDetail> pageData = billDetailRepository.findByBillIdAndDeletedFalse(billId, pageable);

        // Chuyển đổi sang DTO
        Page<BillDetailResponseDTO> dtoPage = pageData.map(this::buildBillDetailResponseDTO);

        return new PaginationResponse<>(dtoPage);
    }

    @Override
    @Transactional
    public BillDetailResponseDTO addProductToBill(Integer billId, Integer productDetailId) {
        // Kiểm tra bill tồn tại
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        // Kiểm tra product detail tồn tại
        ProductDetail productDetail = productDetailRepository.findById(productDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (productDetail.getQuantity() <= 0) {
            throw new RuntimeException("Sản phẩm đã hết hàng");
        }

        // Kiểm tra sản phẩm đã tồn tại trong bill chưa
        Optional<BillDetail> existingBillDetail = billDetailRepository.findByBillIdAndDetailProductId(billId,
                productDetailId);
        if (existingBillDetail.isPresent()) {
            // Nếu đã tồn tại thì tăng số lượng lên 1
            BillDetail billDetail = existingBillDetail.get();
            billDetail.setQuantity(billDetail.getQuantity() + 1);
            billDetail.setUpdatedAt(Instant.now());
            billDetail.setUpdatedBy("system");

            // Giảm số lượng trong product detail
            productDetail.setQuantity(productDetail.getQuantity() - 1);
            if (productDetail.getQuantity() <= 0) {
                productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
                productDetail.setQuantity(0);
            }
            productDetailRepository.save(productDetail);

            BillDetail savedBillDetail = billDetailRepository.save(billDetail);

            // Cập nhật tổng tiền cho bill
            BigDecimal totalPrice = billDetail.getPromotionalPrice() != null
                    ? billDetail.getPromotionalPrice().multiply(BigDecimal.valueOf(1))
                    : billDetail.getPrice().multiply(BigDecimal.valueOf(1));
            if (bill.getTotalMoney() == null) {
                bill.setTotalMoney(BigDecimal.ZERO);
            }
            bill.setTotalMoney(bill.getTotalMoney().add(totalPrice));
            bill.setUpdatedAt(Instant.now());
            bill.setUpdatedBy("system");
            billRepository.save(bill);

            return buildBillDetailResponseDTO(savedBillDetail);
        }

        // Tạo bill detail mới
        BillDetail billDetail = new BillDetail();
        billDetail.setBill(bill);
        billDetail.setDetailProduct(productDetail);
        billDetail.setQuantity(1);
        billDetail.setPrice(productDetail.getPrice());
        billDetail.setPromotionalPrice(productDetail.getPromotionalPrice());
        billDetail.setStatus(BillDetailStatus.PENDING);
        billDetail.setCreatedAt(Instant.now());
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setCreatedBy("system");
        billDetail.setUpdatedBy("system");
        billDetail.setDeleted(false);

        // Giảm số lượng trong product detail
        productDetail.setQuantity(productDetail.getQuantity() - 1);
        if (productDetail.getQuantity() <= 0) {
            productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            productDetail.setQuantity(0);
        }
        productDetailRepository.save(productDetail);

        BillDetail savedBillDetail = billDetailRepository.save(billDetail);

        // Cập nhật tổng tiền cho bill
        BigDecimal totalPrice = productDetail.getPromotionalPrice() != null
                ? productDetail.getPromotionalPrice().multiply(BigDecimal.valueOf(1))
                : productDetail.getPrice().multiply(BigDecimal.valueOf(1));
        if (bill.getTotalMoney() == null) {
            bill.setTotalMoney(BigDecimal.ZERO);
        }
        bill.setTotalMoney(bill.getTotalMoney().add(totalPrice));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);

        return buildBillDetailResponseDTO(savedBillDetail);
    }

    @Override
    @Transactional
    public BillDetailResponseDTO updateQuantity(Integer billDetailId, Integer quantity) {
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        ProductDetail productDetail = billDetail.getDetailProduct();
        Bill bill = billDetail.getBill();

        // Tính số lượng thay đổi
        int quantityChange = quantity - billDetail.getQuantity();

        // Kiểm tra số lượng trong kho
        if (productDetail.getQuantity() < quantityChange) {
            throw new RuntimeException("Số lượng sản phẩm trong kho không đủ");
        }

        // Lưu số lượng cũ
        int oldQuantity = billDetail.getQuantity();

        // Cập nhật số lượng trong product detail
        productDetail.setQuantity(productDetail.getQuantity() - quantityChange);
        if (productDetail.getQuantity() <= 0) {
            productDetail.setStatus(ProductStatus.OUT_OF_STOCK);
            productDetail.setQuantity(0);
        }
        productDetailRepository.save(productDetail);

        // Cập nhật số lượng trong bill detail
        billDetail.setQuantity(quantity);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("system");

        BillDetail savedBillDetail = billDetailRepository.save(billDetail);

        // Cập nhật tổng tiền cho bill
        BigDecimal oldTotalPrice = billDetail.getPromotionalPrice() != null
                ? billDetail.getPromotionalPrice().multiply(BigDecimal.valueOf(oldQuantity))
                : billDetail.getPrice().multiply(BigDecimal.valueOf(oldQuantity));

        BigDecimal newTotalPrice = billDetail.getPromotionalPrice() != null
                ? billDetail.getPromotionalPrice().multiply(BigDecimal.valueOf(quantity))
                : billDetail.getPrice().multiply(BigDecimal.valueOf(quantity));

        // Tính lại tổng tiền mới
        BigDecimal newTotal = bill.getTotalMoney().subtract(oldTotalPrice).add(newTotalPrice);
        bill.setTotalMoney(newTotal);
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);

        return buildBillDetailResponseDTO(savedBillDetail);
    }

    private BillDetailResponseDTO buildBillDetailResponseDTO(BillDetail billDetail) {
        return BillDetailResponseDTO.builder()
                .id(billDetail.getId())
                .billId(billDetail.getBill().getId())
                .billCode(billDetail.getBill().getCode())
                .productDetailId(billDetail.getDetailProduct().getId())
                .productName(billDetail.getDetailProduct().getProduct().getName())
                .productColor(billDetail.getDetailProduct().getColor().getName())
                .productSize(billDetail.getDetailProduct().getSize().getName())
                .productImage(
                        billDetail.getDetailProduct().getImages() != null
                                && !billDetail.getDetailProduct().getImages().isEmpty()
                                        ? billDetail.getDetailProduct().getImages().get(0).getUrl()
                                        : null)
                .price(billDetail.getPrice())
                .promotionalPrice(billDetail.getPromotionalPrice())
                .quantity(billDetail.getQuantity())
                .totalPrice(
                        billDetail.getPromotionalPrice() != null
                                ? billDetail.getPromotionalPrice()
                                        .multiply(BigDecimal.valueOf(billDetail.getQuantity()))
                                : billDetail.getPrice().multiply(BigDecimal.valueOf(billDetail.getQuantity())))
                .status(billDetail.getStatus())
                .createdAt(billDetail.getCreatedAt())
                .updatedAt(billDetail.getUpdatedAt())
                .createdBy(billDetail.getCreatedBy())
                .updatedBy(billDetail.getUpdatedBy())
                .build();
    }

    @Override
    @Transactional
    public void deleteBillDetail(Integer billDetailId) {
        // Tìm bill detail
        BillDetail billDetail = billDetailRepository.findById(billDetailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết hóa đơn"));

        // Lấy bill và product detail
        Bill bill = billDetail.getBill();
        ProductDetail productDetail = billDetail.getDetailProduct();

        // Cập nhật số lượng trong product detail
        productDetail.setQuantity(productDetail.getQuantity() + billDetail.getQuantity());
        if (productDetail.getQuantity() > 0) {
            productDetail.setStatus(ProductStatus.AVAILABLE);
        }
        productDetailRepository.save(productDetail);

        // Cập nhật tổng tiền cho bill
        BigDecimal totalPrice = billDetail.getPromotionalPrice() != null
                ? billDetail.getPromotionalPrice().multiply(BigDecimal.valueOf(billDetail.getQuantity()))
                : billDetail.getPrice().multiply(BigDecimal.valueOf(billDetail.getQuantity()));
        bill.setTotalMoney(bill.getTotalMoney().subtract(totalPrice));
        bill.setUpdatedAt(Instant.now());
        bill.setUpdatedBy("system");
        billRepository.save(bill);

        // Xóa bill detail (soft delete)
        billDetail.setDeleted(true);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("system");
        billDetailRepository.save(billDetail);
    }
}
