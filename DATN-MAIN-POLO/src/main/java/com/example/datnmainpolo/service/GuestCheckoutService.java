package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.Checkout.GuestOrderRequestDTO;

public interface GuestCheckoutService {
    BillResponseDTO createOrder(GuestOrderRequestDTO request);
}
