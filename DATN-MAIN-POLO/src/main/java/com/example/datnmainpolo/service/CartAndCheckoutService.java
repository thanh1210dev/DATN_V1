package com.example.datnmainpolo.service;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.CartDetailResponseDTO.CartDetailResponseDTO;
import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationOnlineRequestDTO;
import com.example.datnmainpolo.entity.AccountVoucher;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.enums.PaymentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface CartAndCheckoutService {
    CartDetailResponseDTO addProductToCart(Integer userId, Integer productDetailId, Integer quantity);
    CartDetailResponseDTO updateCartItemQuantity(Integer cartDetailId, Integer quantity);
    void removeProductFromCart(Integer cartDetailId);
    List<CartDetailResponseDTO> getCartItems(Integer userId);
    BillResponseDTO createBillFromCart(Integer userId, Integer addressId, PaymentType paymentType);
    void updateCustomerInformation(Integer billId, Integer addressId);
    PaymentResponseDTO processOnlinePayment(Integer billId, PaymentType paymentType);
    BillResponseDTO confirmOnlinePayment(Integer billId);
    Page<BillResponseDTO> getUserBills(Integer userId, Pageable pageable);
    AccountVoucher applyBestUserVoucher(Integer userId, BigDecimal totalMoney);
    BigDecimal calculateShippingCost(Integer toDistrictId, String toWardCode, Integer weight, Integer length, Integer width, Integer height);
    BigDecimal calculateShippingFee(Integer toDistrictId, String toWardCode, Integer weight, Integer length, Integer width, Integer height);
}