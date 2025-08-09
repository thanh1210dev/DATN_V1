package com.example.datnmainpolo.service.Impl;

import com.example.datnmainpolo.config.JwtUtil;
import com.example.datnmainpolo.dto.LoginDTO.LoginRequest;
import com.example.datnmainpolo.dto.LoginDTO.LoginResponse;
import com.example.datnmainpolo.dto.LoginDTO.RegisterRequest;
import com.example.datnmainpolo.dto.LoginDTO.ForgotPasswordRequest;
import com.example.datnmainpolo.dto.LoginDTO.ResetPasswordRequest;
import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.repository.UserRepository;
import com.example.datnmainpolo.service.Impl.Email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class

AuthService {
    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public LoginResponse login(LoginRequest request) {
    authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getIdentifier(), request.getPassword()
                )
        );

    UserEntity user = userRepository.findFirstByEmailOrderByIdDesc(request.getIdentifier())
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
    // Default role to CLIENT for all self-registrations
    user.setRole(Role.CLIENT);
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

    public String forgotPassword(ForgotPasswordRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(Instant.now().plus(30, ChronoUnit.MINUTES));
        userRepository.save(user);

        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);
        } catch (Exception e) {
            throw new RuntimeException("Không thể gửi email đặt lại mật khẩu");
        }
        return "Vui lòng kiểm tra email để đặt lại mật khẩu";
    }

    public String resetPassword(ResetPasswordRequest request) {
    UserEntity user = userRepository.findByResetToken(request.getToken())
        .orElseThrow(() -> new RuntimeException("Token không hợp lệ"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw new RuntimeException("Token đã hết hạn");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        return "Đặt lại mật khẩu thành công";
    }
}