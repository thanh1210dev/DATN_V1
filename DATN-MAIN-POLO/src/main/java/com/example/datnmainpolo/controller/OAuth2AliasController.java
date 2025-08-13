package com.example.datnmainpolo.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Backward compatibility alias: legacy frontend used /oauth2/authorize/{registrationId}
 * while Spring Security expects /oauth2/authorization/{registrationId}.
 * This controller redirects old pattern to the correct one to prevent 404/500 errors.
 */
@RestController
public class OAuth2AliasController {

    @GetMapping("/oauth2/authorize/{registrationId}")
    public void alias(@PathVariable String registrationId,
                      @RequestParam(value = "redirect_uri", required = false) String redirectUri,
                      HttpServletResponse response) throws IOException {
        String target = "/oauth2/authorization/" + registrationId;
        if (redirectUri != null && !redirectUri.isBlank()) {
            target += "?redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        }
        response.sendRedirect(target);
    }
}
