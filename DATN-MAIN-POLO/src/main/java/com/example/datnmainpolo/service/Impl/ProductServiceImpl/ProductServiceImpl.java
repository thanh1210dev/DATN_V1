package com.example.datnmainpolo.service.Impl.ProductServiceImpl;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ProductDTO.ProductRequestDTO;
import com.example.datnmainpolo.dto.ProductDTO.ProductResponseDTO;
import com.example.datnmainpolo.entity.Brand;
import com.example.datnmainpolo.entity.Category;
import com.example.datnmainpolo.entity.Material;
import com.example.datnmainpolo.entity.Product;
import com.example.datnmainpolo.repository.BrandRepository;
import com.example.datnmainpolo.repository.CategoryRepository;
import com.example.datnmainpolo.repository.MaterialRepository;
import com.example.datnmainpolo.repository.ProductRepository;
import com.example.datnmainpolo.service.ProductService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public ProductResponseDTO create(ProductRequestDTO requestDTO) {
        Product entity = new Product();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        Product saved = productRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponseDTO update(Integer id, ProductRequestDTO requestDTO) {
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Sản phẩm đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        Product saved = productRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        productRepository.save(entity);
    }

    @Override
    public ProductResponseDTO getById(Integer id) {
        Product entity = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Sản phẩm đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<ProductResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Product> pageData = productRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(Product entity, ProductRequestDTO requestDTO) {
        Material material = materialRepository.findById(requestDTO.getMaterialId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chất liệu với ID: " + requestDTO.getMaterialId()));
        Brand brand = brandRepository.findById(requestDTO.getBrandId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thương hiệu với ID: " + requestDTO.getBrandId()));
        Category category = categoryRepository.findById(requestDTO.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + requestDTO.getCategoryId()));

        entity.setMaterial(material);
        entity.setBrand(brand);
        entity.setCategory(category);
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
        entity.setDescription(requestDTO.getDescription());
    }

    private ProductResponseDTO toResponse(Product entity) {
        ProductResponseDTO response = new ProductResponseDTO();
        response.setId(entity.getId());
        response.setMaterialId(entity.getMaterial().getId());
        response.setMaterialName(entity.getMaterial().getName());
        response.setBrandId(entity.getBrand().getId());
        response.setBrandName(entity.getBrand().getName());
        response.setCategoryId(entity.getCategory().getId());
        response.setCategoryName(entity.getCategory().getName());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}