package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.dto.LoginDTO.LoginRequest;
import com.example.datnmainpolo.dto.LoginDTO.LoginResponse;
import com.example.datnmainpolo.dto.LoginDTO.RegisterRequest;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.dto.UserDTO.UserResponseDTO;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.service.Impl.AuthService;
import com.example.datnmainpolo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final AuthService authService;
    @Autowired
    private UserService userService;

    @GetMapping("/search")
    public PaginationResponse<UserResponseDTO> findByCodeAndName(
            @RequestParam(required = false) String code,

            @RequestParam(required = false) String name,

            @RequestParam(defaultValue = "0") int page,

            @RequestParam(defaultValue = "10") int size) {
        return userService.findByCodeAndName(code, name, page, size);
    }

    @GetMapping("/search/client")
    public PaginationResponse<UserResponseDTO> findByCodeAndNameClient(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Integer minLoyaltyPoints,
            @RequestParam(required = false) Integer maxLoyaltyPoints,

            @RequestParam(required = false) LocalDate birthDate,

            @RequestParam(required = false) Instant startDate,

            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return userService.findByCodeAndNameofClient(
                code, name, phoneNumber, email, minLoyaltyPoints, maxLoyaltyPoints,
                birthDate, startDate, endDate, page, size);
    }

    @GetMapping("/top-purchasers")
    public PaginationResponse<UserResponseDTO> findTopPurchasers(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return userService.findTopPurchasers(code, name, page, size);
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody UserRequestDTO requestDTO) {
        UserResponseDTO created = userService.createUser(requestDTO);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Integer id, @Valid @RequestBody UserRequestDTO requestDTO) {
        UserResponseDTO updated = userService.updateUser(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Integer id) {
        UserResponseDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteUser(@PathVariable Integer id) {
        userService.softDeleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/search/customers")
    public PaginationResponse<UserResponseDTO> getAllCustomers(
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return userService.findByPhoneNumberOrNameOrEmailAndRole(
                phoneNumber, name, email, Role.CLIENT, page, size);
    }
}