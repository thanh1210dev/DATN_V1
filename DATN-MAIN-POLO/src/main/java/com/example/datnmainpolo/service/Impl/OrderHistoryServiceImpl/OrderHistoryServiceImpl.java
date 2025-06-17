package com.example.datnmainpolo.service.Impl.OrderHistoryServiceImpl;

import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryRequestDTO;
import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.entity.Bill;
import com.example.datnmainpolo.entity.OrderHistory;
import com.example.datnmainpolo.repository.BillRepository;
import com.example.datnmainpolo.repository.OrderHistoryRepository;
import com.example.datnmainpolo.service.OrderHistoryService;
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
public class OrderHistoryServiceImpl implements OrderHistoryService {
    private final OrderHistoryRepository orderHistoryRepository;
    private final BillRepository billRepository;
    @Override
    @Transactional
    public OrderHistoryResponseDTO create(OrderHistoryRequestDTO requestDTO) {
        OrderHistory entity = new OrderHistory();
        mapToEntity(entity, requestDTO);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        OrderHistory savedEntity = orderHistoryRepository.save(entity);
        return toResponse(savedEntity);
    }

    @Override
    @Transactional
    public OrderHistoryResponseDTO update(Integer id, OrderHistoryRequestDTO requestDTO) {
        OrderHistory entity = orderHistoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lịch sử đặt hàng với ID: " + id));
        if(entity.getDeleted() == true){
            throw new IllegalArgumentException("Lịch sử đơn hàng bị xóa");
        }
        mapToEntity(entity, requestDTO);
        entity.setUpdatedAt(Instant.now());
        OrderHistory savedEntity = orderHistoryRepository.save(entity);
        return toResponse(savedEntity);
    }

    @Override
    @Transactional
    public void softDelete(Integer id) {
        OrderHistory entity = orderHistoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lịch sử đặt hàng với ID: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(Instant.now());
        orderHistoryRepository.save(entity);
    }

    @Override
    public OrderHistoryResponseDTO getById(Integer id) {
        OrderHistory entity = orderHistoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy lịch sử đặt hàng với ID: " + id));
        if(entity.getDeleted() == true){
            throw new IllegalArgumentException("Lịch sử đơn hàng bị xóa");
        }
        return toResponse(entity);
    }

    @Override
    public PaginationResponse<OrderHistoryResponseDTO> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<OrderHistory> pageData = orderHistoryRepository.findAllByDeletedFalse(pageable);
        return new PaginationResponse<>(pageData.map(this::toResponse));
    }

    private void mapToEntity(OrderHistory entity , OrderHistoryRequestDTO requestDTO) {
        Bill bill = billRepository.findById(requestDTO.getBillId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hóa đơn với ID: " + requestDTO.getBillId()));
        entity.setBill(bill);
        entity.setStatusOrder(requestDTO.getStatusOrder());
        entity.setActionDescription(requestDTO.getActionDescription());
    }

    private OrderHistoryResponseDTO toResponse(OrderHistory entity) {
        OrderHistoryResponseDTO response = new OrderHistoryResponseDTO();
        response.setBillId(entity.getId());
        response.setBillId(entity.getBill().getId());
        response.setStatusOrder(entity.getStatusOrder());
        response.setActionDescription(entity.getActionDescription());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }
}
