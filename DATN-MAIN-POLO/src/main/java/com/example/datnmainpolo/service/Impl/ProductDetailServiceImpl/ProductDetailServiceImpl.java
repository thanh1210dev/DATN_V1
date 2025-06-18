package com.example.datnmainpolo.service.Impl.ProductDetailServiceImpl;


import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailRequestDTO;
import com.example.datnmainpolo.dto.ProductDetailDTO.ProductDetailResponseDTO;
import com.example.datnmainpolo.entity.Image;
import com.example.datnmainpolo.entity.Product;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.enums.ProductStatus;
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

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductDetailServiceImpl implements ProductDetailService {
    private final ProductDetailRepository productDetailRepository;
    private final ProductRepository productRepository;
    private final ImageRepository imageRepository;
    private final SizeRepository sizeRepository;
    private final ColorRepository colorRepository;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public List<ProductDetailResponseDTO> create(ProductDetailRequestDTO requestDTO) {
        Product product = productRepository.findById(requestDTO.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + requestDTO.getProductId()));

        List<Image> images = requestDTO.getImageIds().stream()
                .map(id -> imageRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ảnh với ID: " + id)))
                .collect(Collectors.toList());

        List<ProductDetailResponseDTO> responses = new ArrayList<>();

        // Tạo bản ghi cho từng tổ hợp sizeId và colorId
        for (Integer sizeId : requestDTO.getSizeIds()) {
            for (Integer colorId : requestDTO.getColorIds()) {
                // Kiểm tra trùng lặp
                if (productDetailRepository.existsByProductIdAndSizeIdAndColorId(
                        requestDTO.getProductId(), sizeId, colorId)) {
                    throw new IllegalStateException("Chi tiết sản phẩm với productId: " + requestDTO.getProductId() +
                            ", sizeId: " + sizeId + ", colorId: " + colorId + " đã tồn tại");
                }

                // Tạo mã duy nhất cho từng tổ hợp
                String code = generateUniqueCode(requestDTO.getCode(), sizeId, colorId);

                ProductDetail entity = new ProductDetail();
                entity.setProduct(product);
                entity.setImages(new ArrayList<>(images)); // Sao chép danh sách ảnh
                entity.setSize(sizeRepository.findById(sizeId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kích thước với ID: " + sizeId)));
                entity.setColor(colorRepository.findById(colorId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy màu sắc với ID: " + colorId)));
                entity.setCode(code);
                entity.setQuantity(requestDTO.getQuantity());
                entity.setPrice(requestDTO.getPrice());
                entity.setStatus(ProductStatus.AVAILABLE);
                entity.setCreatedAt(Instant.now());
                entity.setDeleted(false);

                ProductDetail saved = productDetailRepository.save(entity);
                responses.add(toResponse(saved));
            }
        }

        return responses;
    }

    private String generateUniqueCode(String baseCode, Integer sizeId, Integer colorId) {
        if (baseCode != null && !baseCode.isEmpty()) {
            // Sử dụng baseCode và thêm sizeId/colorId để đảm bảo duy nhất
            // Giới hạn tổng chiều dài mã là 5 ký tự
            String suffix = "-" + sizeId + colorId;
            int maxBaseLength = 5 - suffix.length();
            if (maxBaseLength < 1) {
                throw new IllegalArgumentException("Mã cơ sở quá dài để thêm hậu tố size/color");
            }
            baseCode = baseCode.length() > maxBaseLength ? baseCode.substring(0, maxBaseLength) : baseCode;
            return baseCode + suffix;
        } else {
            // Tạo mã ngẫu nhiên 5 ký tự
            String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            StringBuilder result = new StringBuilder();
            Random random = new Random();
            for (int i = 0; i < 5; i++) {
                result.append(characters.charAt(random.nextInt(characters.length())));
            }
            return result.toString();
        }
    }


    @Override
    @Transactional
    public ProductDetailResponseDTO update(Integer id, ProductDetailRequestDTO requestDTO) {
        ProductDetail entity = productDetailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chi tiết sản phẩm với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Chi tiết sản phẩm đã bị xóa");
        }

        // Kiểm tra trùng lặp nếu sizeId hoặc colorId thay đổi
        Integer sizeId = requestDTO.getSizeIds().get(0); // Chỉ lấy size đầu tiên cho update
        Integer colorId = requestDTO.getColorIds().get(0); // Chỉ lấy color đầu tiên cho update
        if (!entity.getSize().getId().equals(sizeId) || !entity.getColor().getId().equals(colorId)) {
            if (productDetailRepository.existsByProductIdAndSizeIdAndColorId(
                    requestDTO.getProductId(), sizeId, colorId)) {
                throw new IllegalStateException("Chi tiết sản phẩm với productId: " + requestDTO.getProductId() +
                        ", sizeId: " + sizeId + ", colorId: " + colorId + " đã tồn tại");
            }
        }

        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        entity.setCode(generateRandomCode(requestDTO.getCode()));
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
    public PaginationResponse<ProductDetailResponseDTO> getAll(Integer id, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<ProductDetail> pageData = productDetailRepository.findByDeletedAndProduct_Id(
                false, id, pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private String generateRandomCode(String providedCode) {
        if (providedCode != null && !providedCode.isEmpty()) {
            return providedCode;
        }
        StringBuilder sb = new StringBuilder(5);
        for (int i = 0; i < 5; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }

    private void mapToEntity(ProductDetail entity, ProductDetailRequestDTO requestDTO) {
        Product product = productRepository.findById(requestDTO.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + requestDTO.getProductId()));
        entity.setProduct(product);

        entity.setImages(requestDTO.getImageIds().stream()
                .map(id -> imageRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ảnh với ID: " + id)))
                .collect(Collectors.toList()));

        entity.setSize(sizeRepository.findById(requestDTO.getSizeIds().get(0))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kích thước với ID: " + requestDTO.getSizeIds().get(0))));
        entity.setColor(colorRepository.findById(requestDTO.getColorIds().get(0))
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy màu sắc với ID: " + requestDTO.getColorIds().get(0))));

        entity.setQuantity(requestDTO.getQuantity());
        entity.setPrice(requestDTO.getPrice());
        entity.setStatus(requestDTO.getStatus());
    }

    private ProductDetailResponseDTO toResponse(ProductDetail entity) {
        ProductDetailResponseDTO response = new ProductDetailResponseDTO();
        response.setId(entity.getId());
        response.setProductId(entity.getProduct().getId());
        response.setProductName(entity.getProduct().getName());
        response.setProductCode(entity.getProduct().getCode());
        response.setCode(entity.getCode());
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