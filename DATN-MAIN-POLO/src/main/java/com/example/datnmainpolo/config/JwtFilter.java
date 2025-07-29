package com.example.datnmainpolo.config;

import com.example.datnmainpolo.service.Impl.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        // Log để debug
        System.out.println("=== JWT FILTER DEBUG ===");
        System.out.println("URI: " + uri);
        System.out.println("Method: " + method);
        
        // Bỏ qua kiểm tra token cho các endpoint công khai
        if (
                uri.startsWith("/login") ||
                        uri.startsWith("/oauth2") ||
                        uri.startsWith("/api") ||
                        uri.startsWith("/v3/api-docs") ||
                        uri.startsWith("/swagger-ui") ||         // bao phủ index.html, *.js, *.css
                        uri.equals("/swagger-ui.html")
        ) {
            System.out.println("Skipping JWT validation for public endpoint: " + uri);
            chain.doFilter(request, response);
            return;
        }

        System.out.println("Applying JWT validation for endpoint: " + uri);
        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                String identifier = jwtUtil.extractIdentifier(token);
                var userDetails = userDetailsService.loadUserByUsername(identifier);

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        chain.doFilter(request, response);
    }
}