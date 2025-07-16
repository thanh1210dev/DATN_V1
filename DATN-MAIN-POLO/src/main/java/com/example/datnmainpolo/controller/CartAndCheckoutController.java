package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.BillDTO.BillResponseDTO;
import com.example.datnmainpolo.dto.BillDTO.PaymentResponseDTO;
import com.example.datnmainpolo.dto.CartDetailResponseDTO.CartDetailResponseDTO;
import com.example.datnmainpolo.dto.CartDetailResponseDTO.CustomerInformationRequestDTO;
import com.example.datnmainpolo.entity.CustomerInformation;
import com.example.datnmainpolo.enums.PaymentType;
import com.example.datnmainpolo.service.AddressService;
import com.example.datnmainpolo.service.CartAndCheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart-checkout")
public class CartAndCheckoutController {
    private final CartAndCheckoutService cartAndCheckoutService;
    private final AddressService addressService;

    @PostMapping("/cart/add")
    public ResponseEntity<CartDetailResponseDTO> addProductToCart(
            @RequestParam Integer userId,
            @RequestParam Integer productDetailId,
            @RequestParam Integer quantity) {
        CartDetailResponseDTO response = cartAndCheckoutService.addProductToCart(userId, productDetailId, quantity);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/cart/update-quantity/{cartDetailId}")
    public ResponseEntity<CartDetailResponseDTO> updateCartItemQuantity(
            @PathVariable Integer cartDetailId,
            @RequestParam Integer quantity) {
        CartDetailResponseDTO response = cartAndCheckoutService.updateCartItemQuantity(cartDetailId, quantity);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cart/remove/{cartDetailId}")
    public ResponseEntity<Void> removeProductFromCart(@PathVariable Integer cartDetailId) {
        cartAndCheckoutService.removeProductFromCart(cartDetailId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/cart/{userId}")
    public ResponseEntity<List<CartDetailResponseDTO>> getCartItems(@PathVariable Integer userId) {
        List<CartDetailResponseDTO> cartItems = cartAndCheckoutService.getCartItems(userId);
        return ResponseEntity.ok(cartItems);
    }

    @PostMapping("/create-bill")
    public ResponseEntity<BillResponseDTO> createBillFromCart(
            @RequestParam Integer userId,
            @RequestParam Integer addressId,
            @RequestParam PaymentType paymentType) {
        BillResponseDTO response = cartAndCheckoutService.createBillFromCart(userId, addressId, paymentType);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/checkout/update-customer-info/{billId}")
    public ResponseEntity<Void> updateCustomerInformation(
            @PathVariable Integer billId,
            @RequestParam Integer addressId) {
        cartAndCheckoutService.updateCustomerInformation(billId, addressId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/process-payment/{billId}")
    public ResponseEntity<PaymentResponseDTO> processOnlinePayment(
            @PathVariable Integer billId,
            @RequestParam PaymentType paymentType,
            @RequestParam BigDecimal amount) {
        PaymentResponseDTO response = cartAndCheckoutService.processOnlinePayment(billId, paymentType, amount);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm-payment/{billId}")
    public ResponseEntity<BillResponseDTO> confirmOnlinePayment(@PathVariable Integer billId) {
        BillResponseDTO response = cartAndCheckoutService.confirmOnlinePayment(billId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bills")
    public ResponseEntity<Page<BillResponseDTO>> getUserBills(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BillResponseDTO> bills = cartAndCheckoutService.getUserBills(userId, pageable);
        return ResponseEntity.ok(bills);
    }

    @PostMapping("/address/add")
    public ResponseEntity<CustomerInformation> addAddress(
            @RequestParam Integer userId,
            @RequestBody CustomerInformationRequestDTO addressDTO) {
        CustomerInformation response = addressService.addAddress(userId, addressDTO);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/address/update/{addressId}")
    public ResponseEntity<CustomerInformation> updateAddress(
            @PathVariable Integer addressId,
            @RequestBody CustomerInformationRequestDTO addressDTO) {
        CustomerInformation response = addressService.updateAddress(addressId, addressDTO);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/address/delete/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Integer addressId) {
        addressService.deleteAddress(addressId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/address/{userId}")
    public ResponseEntity<List<CustomerInformation>> getUserAddresses(@PathVariable Integer userId) {
        List<CustomerInformation> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(addresses);
    }

    @PutMapping("/address/set-default/{addressId}")
    public ResponseEntity<CustomerInformation> setDefaultAddress(
            @PathVariable Integer addressId,
            @RequestParam Integer userId) {
        CustomerInformation response = addressService.setDefaultAddress(userId, addressId);
        return ResponseEntity.ok(response);
    }
}