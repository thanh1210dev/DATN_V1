package com.example.datnmainpolo.service.Impl.CustomerInformationImpl;

import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.dto.CustomerInformaitonDTO.CustomerInformationResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.repository.CustomerInformationRepository;
import com.example.datnmainpolo.service.CustomerInformationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class CustomerInformationImpl implements CustomerInformationService {
    private final CustomerInformationRepository customerInformationRepository;

    @Override
    public CustomerInformationResponseDTO create(CustomerInformationRequestDTO requestDTO) {
        CustomerInformation entity = new CustomerInformation();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setDeleted(false);
        CustomerInformation savedEntity = customerInformationRepository.save(entity);
        return toResponse(savedEntity);
    }

    @Override
    public CustomerInformationResponseDTO update(Integer id, CustomerInformationRequestDTO requestDTO) {
        CustomerInformation entity = customerInformationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khách hàng với ID: " + id));

        if (entity.getDeleted()) {
            throw new IllegalStateException("Khách hàng đã bị xóa");
        }

        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        CustomerInformation savedEntity = customerInformationRepository.save(entity);
        return toResponse(savedEntity);
    }

    @Override
    public void softDelete(Integer id) {
        CustomerInformation entity = customerInformationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khách hàng với ID: " + id));

        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        customerInformationRepository.save(entity);
    }

    @Override
    public CustomerInformationResponseDTO getById(Integer id) {
        CustomerInformation entity = customerInformationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khách hàng với ID: " + id));

        if (entity.getDeleted()) {
            throw new IllegalStateException("Khách hàng đã bị xóa");
        }

        return toResponse(entity);
    }

    @Override
    public PaginationResponse<CustomerInformationResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<CustomerInformation> pageData = customerInformationRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(CustomerInformation entity, CustomerInformationRequestDTO requestDTO) {
        entity.setName(requestDTO.getName());
        entity.setAddress(requestDTO.getAddress());
    }

    private CustomerInformationResponseDTO toResponse(CustomerInformation entity) {
        CustomerInformationResponseDTO responseDTO = new CustomerInformationResponseDTO();
        responseDTO.setId(entity.getId());
        responseDTO.setName(entity.getName());
        responseDTO.setAddress(entity.getAddress());
        responseDTO.setCreatedAt(entity.getCreatedAt());
        responseDTO.setUpdatedAt(entity.getUpdatedAt());
        return responseDTO;
    }
}
