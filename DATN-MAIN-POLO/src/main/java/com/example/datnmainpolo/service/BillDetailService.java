package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailCreateDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;


public interface BillDetailService {
    BillDetailResponseDTO createBillDetail(Integer billId, BillDetailCreateDTO request);
    PaginationResponse<BillDetailResponseDTO> getBillDetailsByBillId(Integer billId, int page, int size);

    BillDetailResponseDTO addProductToBill(Integer billId, Integer productDetailId);
    BillDetailResponseDTO updateQuantity(Integer billDetailId, Integer quantity);
    void deleteBillDetail(Integer billDetailId);
}
