package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryRequestDTO;
import com.example.datnmainpolo.dto.OrderHistoryDTO.OrderHistoryResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.enums.OrderStatus;

public interface OrderHistoryService {
    OrderHistoryResponseDTO create(OrderHistoryRequestDTO requestDTO);
    OrderHistoryResponseDTO update(Integer id,OrderHistoryRequestDTO requestDTO);
    void softDelete(Integer id);
    OrderHistoryResponseDTO getById(Integer id);
    PaginationResponse<OrderHistoryResponseDTO> getAll(int page, int size);
    void addHistory(Integer billId, String actionDescription, String createdBy);
}
