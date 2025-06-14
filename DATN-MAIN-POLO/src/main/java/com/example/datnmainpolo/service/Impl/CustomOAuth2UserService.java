package com.example.datnmainpolo.service.Impl;


import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.enums.Role;
import com.example.datnmainpolo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String fullName = (String) attributes.get("name");
        String avatar = (String) attributes.get("picture");

        UserEntity user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserEntity newUser = new UserEntity();
                    newUser.setEmail(email);
                    newUser.setName(fullName);
                    newUser.setAvatar(avatar);
                    newUser.setDeleted(false);
                    newUser.setCreatedAt(Instant.now());
                    newUser.setPassword(passwordEncoder.encode("defaultOAuthPassword")); // Configure this
                    newUser.setRole(Role.CLIENT); // Configure default role
                    newUser.setCode("PH" + (10000 + new Random().nextInt(90000)));
                    return userRepository.save(newUser);
                });

        return oAuth2User;
    }
}