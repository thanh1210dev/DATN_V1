package com.example.datnmainpolo.service.Impl.BillDetailServiceImpl;

import com.example.datnmainpolo.dto.BillDTO.BillRequestDTO;
import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorRequestDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.BillDetail;
import com.example.datnmainpolo.entity.Color;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.enums.BillDetailStatus;
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

@Service
@RequiredArgsConstructor
public class BillDetailServiceImpl implements BillDetailService {
    private final BillDetailRepository billDetailRepository;
    private final BillRepository billRepository;
    private final ProductDetailRepository productDetailRepository;

    @Override
    @Transactional
    public BillDetailResponseDTO createAdmin(BillDetailRequestDTO requestDTO) {
        Bill bill = billRepository.findById(requestDTO.getBillId())
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        // Lấy thông tin sản phẩm chi tiết từ ID
        ProductDetail productDetail = productDetailRepository.findById(requestDTO.getProductDetailId())
                .orElseThrow(() -> new RuntimeException("Product detail not found"));
        BillDetail entity = new BillDetail();
        entity.setBill(bill);
        entity.setDetailProduct(productDetail);
        entity.setQuantity(requestDTO.getQuantity());
        // Kiểm tra xem có giá khuyến mãi không, nếu có dùng giá khuyến mãi, nếu không dùng giá gốc
        if (productDetail.getPromotionalPrice() != null) {
            entity.setPromotionalPrice(productDetail.getPromotionalPrice());
            entity.setPrice(null);
        } else {
            entity.setPrice(productDetail.getPrice());
            entity.setPromotionalPrice(null);
        }
        entity.setStatus(BillDetailStatus.PENDING);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        entity.setDeleted(false);
        // sua doan nay
        entity.setCreatedBy("System");
        entity.setUpdatedBy("System");
        BillDetail savedEntity = billDetailRepository.save(entity);

        return BillDetailResponseDTO.builder()
                .id(savedEntity.getId())
                .billId(savedEntity.getBill().getId())
                .productDetailId(savedEntity.getDetailProduct().getId())
                .quantity(savedEntity.getQuantity())
                .price(savedEntity.getPrice())
                .promotionalPrice(savedEntity.getPromotionalPrice())
                .status(savedEntity.getStatus())
                .createdAt(savedEntity.getCreatedAt())
                .updatedAt(savedEntity.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public BillDetailResponseDTO updateAdmin(Integer id, BillDetailRequestDTO requestDTO) {
        BillDetail billDetail = billDetailRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BillDetail not found"));
        ProductDetail productDetail = productDetailRepository.findById(requestDTO.getProductDetailId())
                .orElseThrow(() -> new RuntimeException("Product detail not found"));

        billDetail.setDetailProduct(productDetail);
        billDetail.setQuantity(requestDTO.getQuantity());

        if (productDetail.getPromotionalPrice() != null) {
            billDetail.setPromotionalPrice(productDetail.getPromotionalPrice());
            billDetail.setPrice(BigDecimal.ZERO); // Nếu có khuyến mãi, giá gốc đặt là 0
        } else {
            billDetail.setPrice(productDetail.getPrice());
            billDetail.setPromotionalPrice(BigDecimal.ZERO); // Nếu không có khuyến mãi, giá khuyến mãi đặt là 0
        }
        billDetail.setStatus(requestDTO.getStatus());

        // Cập nhật thông tin thời gian
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("System");
        // Lưu thay đổi vào cơ sở dữ liệu
        BillDetail updatedEntity = billDetailRepository.save(billDetail);
        return BillDetailResponseDTO.builder()
                .id(updatedEntity.getId())
                .billId(updatedEntity.getBill().getId())
                .productDetailId(updatedEntity.getDetailProduct().getId())
                .quantity(updatedEntity.getQuantity())
                .price(updatedEntity.getPrice())
                .promotionalPrice(updatedEntity.getPromotionalPrice())
                .status(updatedEntity.getStatus())
                .createdAt(updatedEntity.getCreatedAt())
                .updatedAt(updatedEntity.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        BillDetail billDetail = billDetailRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BillDetail not found"));
        billDetail.setDeleted(true);
        billDetail.setUpdatedAt(Instant.now());
        billDetail.setUpdatedBy("System"); // Hoặc lấy từ SecurityContext sau này
        billDetailRepository.save(billDetail);
    }

    @Override
    public BillDetailResponseDTO getById(Integer id) {
        BillDetail billDetail = billDetailRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BillDetail not found"));
        if (billDetail.getDeleted()==true) {
            throw new RuntimeException("BillDetail is deleted");
        }
        return BillDetailResponseDTO.builder()
                .id(billDetail.getId())
                .billId(billDetail.getBill().getId())
                .productDetailId(billDetail.getDetailProduct().getId())
                .quantity(billDetail.getQuantity())
                .price(billDetail.getPrice())
                .promotionalPrice(billDetail.getPromotionalPrice())
                .status(billDetail.getStatus())
                .createdAt(billDetail.getCreatedAt())
                .updatedAt(billDetail.getUpdatedAt())
                .build();
    }

    @Override
    public PaginationResponse<BillDetailResponseDTO> getAllBillDetailByStatusAdmin(BillDetailStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<BillDetail> billDetailPage = billDetailRepository.findAllByStatusAndDeletedFalse(status, pageable);
        return new PaginationResponse<>(
                billDetailPage.map(billDetail -> BillDetailResponseDTO.builder()
                        .id(billDetail.getId())
                        .billId(billDetail.getBill().getId())
                        .productDetailId(billDetail.getDetailProduct().getId())
                        .quantity(billDetail.getQuantity())
                        .price(billDetail.getPrice())
                        .promotionalPrice(billDetail.getPromotionalPrice())
                        .status(billDetail.getStatus())
                        .createdAt(billDetail.getCreatedAt())
                        .updatedAt(billDetail.getUpdatedAt())
                        .build())
        );
    }



}
