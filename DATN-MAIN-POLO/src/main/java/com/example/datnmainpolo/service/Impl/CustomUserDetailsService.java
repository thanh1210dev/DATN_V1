package com.example.datnmainpolo.service.Impl;

import com.example.datnmainpolo.entity.UserEntity;
import com.example.datnmainpolo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        UserEntity user = userRepo.findByEmail(identifier)
                .or(() -> userRepo.findByPhoneNumber(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));

        return new User(
                user.getEmail() != null ? user.getEmail() : user.getPhoneNumber(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
