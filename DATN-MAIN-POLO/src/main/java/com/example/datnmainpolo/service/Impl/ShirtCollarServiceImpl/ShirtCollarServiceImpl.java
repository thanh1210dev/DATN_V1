package com.example.datnmainpolo.service.Impl.ShirtCollarServiceImpl;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.ShirtCollarDTO.ShirtCollarRequestDTO;
import com.example.datnmainpolo.dto.ShirtCollarDTO.ShirtCollarResponseDTO;
import com.example.datnmainpolo.entity.ShirtCollar;
import com.example.datnmainpolo.repository.ShirtCollarRepository;
import com.example.datnmainpolo.service.ShirtCollarService;
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
public class ShirtCollarServiceImpl implements ShirtCollarService {
    private final ShirtCollarRepository shirtCollarRepository;

    @Override
    @Transactional
    public ShirtCollarResponseDTO create(ShirtCollarRequestDTO requestDTO) {
        ShirtCollar entity = new ShirtCollar();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        ShirtCollar saved = shirtCollarRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ShirtCollarResponseDTO update(Integer id, ShirtCollarRequestDTO requestDTO) {
        ShirtCollar entity = shirtCollarRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cổ áo với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Cổ áo đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        ShirtCollar saved = shirtCollarRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        ShirtCollar entity = shirtCollarRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cổ áo với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        shirtCollarRepository.save(entity);
    }

    @Override
    public ShirtCollarResponseDTO getById(Integer id) {
        ShirtCollar entity = shirtCollarRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cổ áo với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Cổ áo đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<ShirtCollarResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<ShirtCollar> pageData = shirtCollarRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(ShirtCollar entity, ShirtCollarRequestDTO requestDTO) {
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
    }

    private ShirtCollarResponseDTO toResponse(ShirtCollar entity) {
        ShirtCollarResponseDTO response = new ShirtCollarResponseDTO();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}