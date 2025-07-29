package com.example.datnmainpolo.config;

import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());


        String fullName = user.getName() != null ? user.getName() : "";
        Integer userId = user.getId() != null ? user.getId() : 0;
        String role = user.getRole() != null ? user.getRole().name() : "";


        String encodedToken = URLEncoder.encode(jwtToken, StandardCharsets.UTF_8);
        String encodedFullName = URLEncoder.encode(fullName, StandardCharsets.UTF_8);
        String encodedRole = URLEncoder.encode(role, StandardCharsets.UTF_8);
        String encodedId = URLEncoder.encode(userId.toString(), StandardCharsets.UTF_8);

        String redirectUrl = String.format(
                "http://localhost:3000/oauth2/redirect?token=%s&name=%s&role=%s&id=%s",
                encodedToken,
                encodedFullName,
                encodedRole,
                encodedId
        );

        response.sendRedirect(redirectUrl);
    }
}