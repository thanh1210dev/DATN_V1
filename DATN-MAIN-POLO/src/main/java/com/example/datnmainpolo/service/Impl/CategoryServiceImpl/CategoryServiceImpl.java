package com.example.datnmainpolo.service.Impl.CategoryServiceImpl;

import com.example.datnmainpolo.dto.CategoryDTO.CategoryRequestDTO;
import com.example.datnmainpolo.dto.CategoryDTO.CategoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Category;
import com.example.datnmainpolo.repository.CategoryRepository;
import com.example.datnmainpolo.service.CategoryService;
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
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional
    public CategoryResponseDTO create(CategoryRequestDTO requestDTO) {
        Category entity = new Category();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        Category saved = categoryRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CategoryResponseDTO update(Integer id, CategoryRequestDTO requestDTO) {
        Category entity = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Danh mục đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        Category saved = categoryRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Category entity = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));
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
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}