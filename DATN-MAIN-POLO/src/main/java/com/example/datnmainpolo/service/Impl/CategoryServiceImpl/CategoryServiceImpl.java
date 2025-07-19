package com.example.datnmainpolo.service.Impl.CategoryServiceImpl;

import com.example.datnmainpolo.dto.CategoryDTO.CategoryRequestDTO;
import com.example.datnmainpolo.dto.CategoryDTO.CategoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Category;
import com.example.datnmainpolo.repository.CategoryRepository;
import com.example.datnmainpolo.service.CategoryService;
import com.example.datnmainpolo.service.Impl.ImageService.FileStorageService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${upload.dir}")
    private String uploadDir;

    @Override
@Transactional
public CategoryResponseDTO create(CategoryRequestDTO requestDTO, MultipartFile image) {
    Category entity = new Category();
    mapToEntity(entity, requestDTO);
    entity.setCreatedAt(Instant.now());
    entity.setDeleted(false);

    // Xử lý upload ảnh
    if (image != null && !image.isEmpty()) {
        try {
            String imageUrl = fileStorageService.uploadFile(image);
            entity.setImageUrl(imageUrl);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi upload ảnh", e);
        }
    }
    Category saved = categoryRepository.save(entity);
    return toResponse(saved);
}

@Override
@Transactional
public CategoryResponseDTO update(Integer id, CategoryRequestDTO requestDTO, MultipartFile image) {
    Category entity = categoryRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));
    if (entity.getDeleted()) {
        throw new IllegalStateException("Danh mục đã bị xóa");
    }
    mapToEntity(entity, requestDTO);
    entity.setUpdatedAt(Instant.now());

    // Nếu có ảnh mới, xóa ảnh cũ (nếu có), upload ảnh mới
    if (image != null && !image.isEmpty()) {
        // Xóa file ảnh cũ nếu có
        if (entity.getImageUrl() != null) {
            deletePhysicalImage(entity.getImageUrl());
        }
        try {
            String imageUrl = fileStorageService.uploadFile(image);
            entity.setImageUrl(imageUrl);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi upload ảnh", e);
        }
    }
    Category saved = categoryRepository.save(entity);
    return toResponse(saved);
}

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Category entity = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));
        if (entity.getImageUrl() != null) {
            deletePhysicalImage(entity.getImageUrl());
        }
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        categoryRepository.save(entity);
    }

    @Override
    public CategoryResponseDTO getById(Integer id) {
        Category entity = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Danh mục đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<CategoryResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Category> pageData = categoryRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(Category entity, CategoryRequestDTO requestDTO) {
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
    }

    private CategoryResponseDTO toResponse(Category entity) {
        CategoryResponseDTO response = new CategoryResponseDTO();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setImageUrl(entity.getImageUrl());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    private void deletePhysicalImage(String imageUrl) {
        if (imageUrl != null && !imageUrl.isEmpty()) {
            String fileName = imageUrl.replace("/images/", "");
            Path filePath = Paths.get(uploadDir, fileName);
            File file = new File(filePath.toString());
            if (file.exists()) {
                file.delete();
            }
        }
    }
}