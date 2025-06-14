package com.example.datnmainpolo.service.Impl.MaterialServiceImpl;

import com.example.datnmainpolo.dto.MaterialDTO.MaterialRequestDTO;
import com.example.datnmainpolo.dto.MaterialDTO.MaterialResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Material;
import com.example.datnmainpolo.repository.MaterialRepository;
import com.example.datnmainpolo.service.MaterialService;
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
public class MaterialServiceImpl implements MaterialService {
    private final MaterialRepository materialRepository;

    @Override
    @Transactional
    public MaterialResponseDTO create(MaterialRequestDTO requestDTO) {
        Material entity = new Material();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        Material saved = materialRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public MaterialResponseDTO update(Integer id, MaterialRequestDTO requestDTO) {
        Material entity = materialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chất liệu với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Chất liệu đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        Material saved = materialRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Material entity = materialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chất liệu với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        materialRepository.save(entity);
    }

    @Override
    public MaterialResponseDTO getById(Integer id) {
        Material entity = materialRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chất liệu với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Chất liệu đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<MaterialResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Material> pageData = materialRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(Material entity, MaterialRequestDTO requestDTO) {
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
    }

    private MaterialResponseDTO toResponse(Material entity) {
        MaterialResponseDTO response = new MaterialResponseDTO();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}