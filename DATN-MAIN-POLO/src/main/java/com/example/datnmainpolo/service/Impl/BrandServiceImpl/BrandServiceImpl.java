package com.example.datnmainpolo.service.Impl.BrandServiceImpl;

import com.example.datnmainpolo.dto.BrandDTO.BrandRequestDTO;
import com.example.datnmainpolo.dto.BrandDTO.BrandResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Brand;
import com.example.datnmainpolo.repository.BrandRepository;
import com.example.datnmainpolo.service.BrandService;
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
public class BrandServiceImpl implements BrandService {
    private final BrandRepository brandRepository;

    @Override
    @Transactional
    public BrandResponseDTO create(BrandRequestDTO requestDTO) {
        Brand entity = new Brand();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        Brand saved = brandRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BrandResponseDTO update(Integer id, BrandRequestDTO requestDTO) {
        Brand entity = brandRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thương hiệu với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Thương hiệu đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        Brand saved = brandRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Brand entity = brandRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thương hiệu với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        brandRepository.save(entity);
    }

    @Override
    public BrandResponseDTO getById(Integer id) {
        Brand entity = brandRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thương hiệu với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Thương hiệu đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<BrandResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Brand> pageData = brandRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(Brand entity, BrandRequestDTO requestDTO) {
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
    }

    private BrandResponseDTO toResponse(Brand entity) {
        BrandResponseDTO response = new BrandResponseDTO();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
