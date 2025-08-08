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
        System.out.println("🔵 URI: " + uri);
        System.out.println("🔵 Method: " + method);
        System.out.println("🔵 Remote Address: " + request.getRemoteAddr());
        System.out.println("🔵 User Agent: " + request.getHeader("User-Agent"));
        
        // Log authorization header
        final String debugAuthHeader = request.getHeader("Authorization");
        System.out.println("🔵 Authorization header: " + (debugAuthHeader != null ? debugAuthHeader.substring(0, Math.min(50, debugAuthHeader.length())) + "..." : "null"));
        
        // Log tất cả headers
        System.out.println("🔵 All request headers:");
        request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
            System.out.println("   " + headerName + ": " + request.getHeader(headerName));
        });
        
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
        System.out.println("Full Authorization header: " + authHeader);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final String token = authHeader.substring(7);
            System.out.println("Extracted token: " + token.substring(0, Math.min(20, token.length())) + "...");
            
            try {
                if (jwtUtil.isTokenValid(token)) {
                    System.out.println("✅ Token is valid");
                    String identifier = jwtUtil.extractIdentifier(token);
                    System.out.println("Extracted identifier: " + identifier);
                    
                    var userDetails = userDetailsService.loadUserByUsername(identifier);
                    System.out.println("Loaded user: " + userDetails.getUsername() + " with authorities: " + userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("✅ Authentication set in SecurityContext");
                } else {
                    System.out.println("❌ Token is invalid");
                }
            } catch (Exception e) {
                System.out.println("❌ Error processing token: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("❌ No valid Authorization header found");
        }

        chain.doFilter(request, response);
    }
}