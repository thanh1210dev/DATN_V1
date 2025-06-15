package com.example.datnmainpolo.service.Impl.ProductDetailServiceImpl;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailRequestDTO;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;
import com.example.datnmainpolo.entity.Image;
import com.example.datnmainpolo.entity.Product;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.repository.*;
import com.example.datnmainpolo.service.ProductDetailService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductDetailServiceImpl implements ProductDetailService {
    private final ProductDetailRepository productDetailRepository;
    private final ProductRepository productRepository;
    private final ImageRepository imageRepository;
    private final SizeRepository sizeRepository;
    private final ColorRepository colorRepository;


    @Override
    @Transactional
    public ProductDetailResponseDTO create(ProductDetailRequestDTO requestDTO) {
        ProductDetail entity = new ProductDetail();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        ProductDetail saved = productDetailRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductDetailResponseDTO update(Integer id, ProductDetailRequestDTO requestDTO) {
        ProductDetail entity = productDetailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chi tiết sản phẩm với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Chi tiết sản phẩm đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        ProductDetail saved = productDetailRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        ProductDetail entity = productDetailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chi tiết sản phẩm với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        productDetailRepository.save(entity);
    }

    @Override
    public ProductDetailResponseDTO getById(Integer id) {
        ProductDetail entity = productDetailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chi tiết sản phẩm với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Chi tiết sản phẩm đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<ProductDetailResponseDTO> getAll( int id,int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<ProductDetail> pageData = productDetailRepository.findByDeletedAndProduct_Id(
                false,id, pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(ProductDetail entity, ProductDetailRequestDTO requestDTO) {
        Product product = productRepository.findById(requestDTO.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + requestDTO.getProductId()));
        entity.setProduct(product);

        entity.setImages(requestDTO.getImageIds().stream()
                .map(id -> imageRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ảnh với ID: " + id)))
                .collect(Collectors.toList()));

        entity.setSize(sizeRepository.findById(requestDTO.getSizeId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kích thước với ID: " + requestDTO.getSizeId())));
        entity.setColor(colorRepository.findById(requestDTO.getColorId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy màu sắc với ID: " + requestDTO.getColorId())));

        entity.setQuantity(requestDTO.getQuantity());
        entity.setPrice(requestDTO.getPrice());
        entity.setPromotionalPrice(requestDTO.getPromotionalPrice());
        entity.setStatus(requestDTO.getStatus());
    }

    private ProductDetailResponseDTO toResponse(ProductDetail entity) {
        ProductDetailResponseDTO response = new ProductDetailResponseDTO();
        response.setId(entity.getId());
        response.setProductId(entity.getProduct().getId());
        response.setProductName(entity.getProduct().getName());
        response.setProductCode(entity.getProduct().getCode());
        response.setImages(entity.getImages().stream()
                .map(image -> {
                    ProductDetailResponseDTO.ImageDTO imageDTO = new ProductDetailResponseDTO.ImageDTO();
                    imageDTO.setId(image.getId());
                    imageDTO.setUrl(image.getUrl());
                    return imageDTO;
                })
                .collect(Collectors.toList()));
        response.setSizeId(entity.getSize().getId());
        response.setSizeName(entity.getSize().getName());
        response.setColorId(entity.getColor().getId());
        response.setColorName(entity.getColor().getName());
        response.setColorCode(entity.getColor().getCode());
        response.setQuantity(entity.getQuantity());
        response.setPrice(entity.getPrice());
        response.setPromotionalPrice(entity.getPromotionalPrice());
        response.setStatus(entity.getStatus());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}