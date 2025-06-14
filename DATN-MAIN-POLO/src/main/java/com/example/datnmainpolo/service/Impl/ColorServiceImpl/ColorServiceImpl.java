package com.example.datnmainpolo.service.Impl.ColorServiceImpl;


import com.example.datnmainpolo.dto.ColorDTO.ColorRequestDTO;
import com.example.datnmainpolo.dto.ColorDTO.ColorResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Color;
import com.example.datnmainpolo.repository.ColorRepository;
import com.example.datnmainpolo.service.ColorService;
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
public class ColorServiceImpl implements ColorService {
    private final ColorRepository colorRepository;

    @Override
    @Transactional
    public ColorResponseDTO create(ColorRequestDTO requestDTO) {
        Color entity = new Color();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        Color saved = colorRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ColorResponseDTO update(Integer id, ColorRequestDTO requestDTO) {
        Color entity = colorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy màu sắc với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Màu sắc đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        Color saved = colorRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Color entity = colorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy màu sắc với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        colorRepository.save(entity);
    }

    @Override
    public ColorResponseDTO getById(Integer id) {
        Color entity = colorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy màu sắc với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Màu sắc đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<ColorResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Color> pageData = colorRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(Color entity, ColorRequestDTO requestDTO) {
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
    }

    private ColorResponseDTO toResponse(Color entity) {
        ColorResponseDTO response = new ColorResponseDTO();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}