package com.example.datnmainpolo.service.Impl.PromotionProductDetailServiceImpl;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailRequestDTO;
import com.example.datnmainpolo.dto.PromotionProductDetailDTO.PromotionProductDetailResponseDTO;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.entity.Promotion;
import com.example.datnmainpolo.entity.PromotionProductDetail;
import com.example.datnmainpolo.enums.PromotionStatus;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import com.example.datnmainpolo.repository.PromotionProductDetailRepository;
import com.example.datnmainpolo.repository.PromotionRepository;
import com.example.datnmainpolo.service.PromotionProductDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import java.time.Instant;
import java.util.Set;

@Service
public class PromotionProductDetailServiceImpl implements PromotionProductDetailService {

    @Autowired
    private PromotionProductDetailRepository promotionProductDetailRepository;

    @Autowired
    private ProductDetailRepository productDetailRepository;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private Validator validator;








    @Override
    public PaginationResponse<PromotionProductDetailResponseDTO> getAllByStatusAndDeletedFalse(PromotionStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<PromotionProductDetail> pageData = promotionProductDetailRepository.findAllByStatusAndDeletedFalse(status, pageable);

        return new PaginationResponse<>(pageData.map(this::mapToResponseDTO));
    }

    @Override
    public PromotionProductDetailResponseDTO createPromotionProductDetail(PromotionProductDetailRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);

        PromotionProductDetail detail = mapToEntity(requestDTO);
        detail.setCreatedAt(Instant.now());
        detail.setUpdatedAt(Instant.now());
        detail.setDeleted(false);

        ProductDetail productDetail = productDetailRepository.findById(requestDTO.getDetailProductId())
                .orElseThrow(() -> new EntityNotFoundException("Chi tiết sản phẩm không tồn tại"));
        detail.setDetailProduct(productDetail);

        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(requestDTO.getPromotionId())
                .orElseThrow(() -> new EntityNotFoundException("Chương trình khuyến mãi không tồn tại"));
        detail.setPromotion(promotion);

        detail = promotionProductDetailRepository.save(detail);
        return mapToResponseDTO(detail);
    }

    @Override
    public PromotionProductDetailResponseDTO updatePromotionProductDetail(Integer id, PromotionProductDetailRequestDTO requestDTO) {
        validateRequestDTO(requestDTO);

        PromotionProductDetail detail = promotionProductDetailRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Chi tiết khuyến mãi sản phẩm không tồn tại"));

        updateEntityFromRequestDTO(detail, requestDTO);
        detail.setUpdatedAt(Instant.now());

        ProductDetail productDetail = productDetailRepository.findById(requestDTO.getDetailProductId())
                .orElseThrow(() -> new EntityNotFoundException("Chi tiết sản phẩm không tồn tại"));
        detail.setDetailProduct(productDetail);

        Promotion promotion = promotionRepository.findByIdAndDeletedFalse(requestDTO.getPromotionId())
                .orElseThrow(() -> new EntityNotFoundException("Chương trình khuyến mãi không tồn tại"));
        detail.setPromotion(promotion);

        detail = promotionProductDetailRepository.save(detail);
        return mapToResponseDTO(detail);
    }

    @Override
    public PromotionProductDetailResponseDTO getPromotionProductDetailById(Integer id) {
        PromotionProductDetail detail = promotionProductDetailRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Chi tiết khuyến mãi sản phẩm không tồn tại"));
        return mapToResponseDTO(detail);
    }



    @Override
    public void softDeletePromotionProductDetail(Integer id) {
        PromotionProductDetail detail = promotionProductDetailRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Chi tiết khuyến mãi sản phẩm không tồn tại"));
        detail.setDeleted(true);
        detail.setUpdatedAt(Instant.now());
        promotionProductDetailRepository.save(detail);
    }



        private void validateRequestDTO(PromotionProductDetailRequestDTO requestDTO) {
            Set<ConstraintViolation<PromotionProductDetailRequestDTO>> violations = validator.validate(requestDTO);
            if (!violations.isEmpty()) {
                throw new ConstraintViolationException(violations);
            }

            if (requestDTO.getPrice() != null && requestDTO.getPriceAfterPromotion() != null &&
                    requestDTO.getPriceAfterPromotion().compareTo(requestDTO.getPrice()) > 0) {
                throw new IllegalArgumentException("Giá sau khi giảm giá phải nhỏ hơn hoặc bằng giá gốc");
            }
        }

        private PromotionProductDetail mapToEntity(PromotionProductDetailRequestDTO dto) {
            PromotionProductDetail detail = new PromotionProductDetail();
            detail.setPrice(dto.getPrice());
            detail.setPriceAfterPromotion(dto.getPriceAfterPromotion());
            return detail;
        }

        private PromotionProductDetailResponseDTO mapToResponseDTO(PromotionProductDetail detail) {
            PromotionProductDetailResponseDTO dto = new PromotionProductDetailResponseDTO();
            dto.setId(detail.getId());
            if (detail.getDetailProduct() != null) {
                dto.setDetailProductId(detail.getDetailProduct().getId());
            }
            if (detail.getPromotion() != null) {
                dto.setPromotionId(detail.getPromotion().getId());
            }
            dto.setPrice(detail.getPrice());
            dto.setPriceAfterPromotion(detail.getPriceAfterPromotion());
            dto.setCreatedAt(detail.getCreatedAt());
            dto.setUpdatedAt(detail.getUpdatedAt());
            dto.setDeleted(detail.getDeleted());
            return dto;
        }

        private void updateEntityFromRequestDTO(PromotionProductDetail detail, PromotionProductDetailRequestDTO dto) {
            detail.setPrice(dto.getPrice());
            detail.setPriceAfterPromotion(dto.getPriceAfterPromotion());
        }
    }