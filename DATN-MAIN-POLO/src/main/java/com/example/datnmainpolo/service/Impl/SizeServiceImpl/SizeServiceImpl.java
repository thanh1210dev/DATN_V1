package com.example.datnmainpolo.service.Impl.SizeServiceImpl;

import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.SizeDTO.SizeRequestDTO;
import com.example.datnmainpolo.dto.SizeDTO.SizeResponseDTO;
import com.example.datnmainpolo.entity.Size;
import com.example.datnmainpolo.repository.SizeRepository;
import com.example.datnmainpolo.service.SizeService;
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
public class SizeServiceImpl implements SizeService {
    private final SizeRepository sizeRepository;

    @Override
    @Transactional
    public SizeResponseDTO create(SizeRequestDTO requestDTO) {
        Size entity = new Size();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        Size saved = sizeRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SizeResponseDTO update(Integer id, SizeRequestDTO requestDTO) {
        Size entity = sizeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kích thước với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Kích thước đã bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        Size saved = sizeRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        Size entity = sizeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kích thước với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        sizeRepository.save(entity);
    }

    @Override
    public SizeResponseDTO getById(Integer id) {
        Size entity = sizeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kích thước với ID: " + id));
        if (entity.getDeleted()) {
            throw new IllegalStateException("Kích thước đã bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<SizeResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<Size> pageData = sizeRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(Size entity, SizeRequestDTO requestDTO) {
        entity.setCode(requestDTO.getCode());
        entity.setName(requestDTO.getName());
    }

    private SizeResponseDTO toResponse(Size entity) {
        SizeResponseDTO response = new SizeResponseDTO();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}