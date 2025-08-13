package com.example.datnmainpolo.controller;

import com.example.datnmainpolo.config.JwtUtil;
import com.example.datnmainpolo.dto.LoginDTO.LoginRequest;
import com.example.datnmainpolo.dto.LoginDTO.LoginResponse;
import com.example.datnmainpolo.dto.LoginDTO.RegisterRequest;
import com.example.datnmainpolo.dto.LoginDTO.ForgotPasswordRequest;
import com.example.datnmainpolo.dto.LoginDTO.ResetPasswordRequest;
import com.example.datnmainpolo.dto.PageDTO.PaginationResponse;
import com.example.datnmainpolo.dto.UserDTO.UserRequestDTO;
import com.example.datnmainpolo.dto.UserDTO.UserResponseDTO;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.service.Impl.AuthService;
import com.example.datnmainpolo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowCredentials = "true")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final AuthService authService;
    private final JwtUtil jwtUtil;
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
    // Log incoming create (mask password length only)
    log.info("[USER_CREATE] code={}, email={}, phone={}, role={}, passwordLength={}",
        requestDTO.getCode(), requestDTO.getEmail(), requestDTO.getPhoneNumber(), requestDTO.getRole(),
        requestDTO.getPassword() == null ? 0 : requestDTO.getPassword().length());
        UserResponseDTO created = userService.createUser(requestDTO);
    log.info("[USER_CREATE_SUCCESS] id={} code={} email={} createdAt={}", created.getId(), created.getCode(), created.getEmail(), created.getCreatedAt());
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Integer id, @Valid @RequestBody UserRequestDTO requestDTO) {
    log.info("[USER_UPDATE] id={} code={} email={} phone={} role={}, passwordProvided={} ", id, requestDTO.getCode(),
        requestDTO.getEmail(), requestDTO.getPhoneNumber(), requestDTO.getRole(),
        (requestDTO.getPassword() != null && !requestDTO.getPassword().isBlank()));
        UserResponseDTO updated = userService.updateUser(id, requestDTO);
    log.info("[USER_UPDATE_SUCCESS] id={} updatedAt={}", updated.getId(), updated.getUpdatedAt());
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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        try {
            return ResponseEntity.ok(authService.forgotPassword(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        try {
            return ResponseEntity.ok(authService.resetPassword(request));
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
        // Normalize blank inputs to null to avoid useless LIKE '%%' and potential validation issues
        String nPhone = (phoneNumber == null || phoneNumber.isBlank()) ? null : phoneNumber.trim();
        String nName = (name == null || name.isBlank()) ? null : name.trim();
        String nEmail = (email == null || email.isBlank()) ? null : email.trim();
        log.info("[USER_CUSTOMER_SEARCH] phone={} name={} email={} page={} size={}", nPhone, nName, nEmail, page, size);
        try {
            return userService.findByPhoneNumberOrNameOrEmailAndRole(
                    nPhone, nName, nEmail, Role.CLIENT, page, size);
        } catch (Exception ex) {
            log.error("[USER_CUSTOMER_SEARCH_ERROR] {}", ex.getMessage(), ex);
            throw ex; // Global handler will map appropriately
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            // Remove "Bearer " prefix
            String jwtToken = token.substring(7);
            
            if (jwtUtil.isTokenValid(jwtToken)) {
                String email = jwtUtil.extractIdentifier(jwtToken);
                String role = jwtUtil.extractRole(jwtToken);
                Integer userId = jwtUtil.extractUserId(jwtToken);
                
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", userId);
                userInfo.put("email", email);
                userInfo.put("role", role);
                
                return ResponseEntity.ok(userInfo);
            } else {
                return ResponseEntity.status(401).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
}