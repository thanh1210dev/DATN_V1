package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.ReturnDTO.CreateReturnRequest;
import com.example.datnmainpolo.dto.ReturnDTO.ReturnResponseDTO;

import java.util.List;

public interface ReturnService {
    // Step 1: customer creates a return request (REQUESTED)
    ReturnResponseDTO createReturn(Integer billId, CreateReturnRequest request);
    // Step 2: admin approves or rejects request
    ReturnResponseDTO approveReturn(Integer returnId);
    ReturnResponseDTO rejectReturn(Integer returnId, String reason);
    // Step 3: complete processing (refund/inventory/voucher sync)
    ReturnResponseDTO completeReturn(Integer returnId);
    List<ReturnResponseDTO> getReturnsByBill(Integer billId);
}
