package com.example.datnmainpolo.service.Impl;

import com.example.datnmainpolo.config.JwtUtil;
import com.example.datnmainpolo.dto.LoginDTO.LoginRequest;
import com.example.datnmainpolo.dto.LoginDTO.LoginResponse;
import com.example.datnmainpolo.dto.LoginDTO.RegisterRequest;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getIdentifier(), request.getPassword()
                )
        );

        UserEntity user = userRepository.findByEmail(request.getIdentifier())
                .or(() -> userRepository.findByPhoneNumber(request.getIdentifier()))
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại"));

        String identifier = user.getEmail() != null ? user.getEmail() : user.getPhoneNumber();
        String token = jwtUtil.generateToken(identifier, user.getRole().name(), user.getId());

        return new LoginResponse(token, user.getName(), user.getRole().name(), user.getId());
    }

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại đã tồn tại");
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setRole(Role.valueOf(request.getRole()));
        user.setCode(generateCode());
        user.setBirthDate(request.getBirthDate());
        user.setDeleted(false);
        user.setCreatedAt(Instant.now());

        userRepository.save(user);
        return "Đăng ký thành công!";
    }

    public String generateCode() {
        Random random = new Random();
        int number = 10000 + random.nextInt(90000);
        return "PH" + number;
    }
}