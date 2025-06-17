package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailRequestDTO;
import com.example.datnmainpolo.dto.BillDetailDTO.BillDetailResponseDTO;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.enums.BillDetailStatus;

public interface BillDetailService {
    BillDetailResponseDTO createAdmin(BillDetailRequestDTO requestDTO);
    BillDetailResponseDTO updateAdmin(Integer id, BillDetailRequestDTO requestDTO);
    void softDelete(Integer id);
    BillDetailResponseDTO getById(Integer id);
    PaginationResponse<BillDetailResponseDTO> getAllBillDetailByStatusAdmin (BillDetailStatus status, int page, int pageSize);

}
