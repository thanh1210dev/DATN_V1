package com.example.datnmainpolo.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ghn-address")
public class GHNAddressController {

    private final RestTemplate restTemplate;

    @Value("${ghn.api.token}")
    private String ghnToken;
    @Value("${ghn.api.base-url}")
    private String ghnBaseUrl;

    @GetMapping("/provinces")
    public ResponseEntity<Map> getProvinces() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            String url = ghnBaseUrl + "/master-data/province";
            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lấy danh sách tỉnh: " + e.getMessage());
        }
    }

    @GetMapping("/districts")
    public ResponseEntity<Map> getDistricts(@RequestParam Integer provinceId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            String url = ghnBaseUrl + "/master-data/district?province_id=" + provinceId;
            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lấy danh sách huyện: " + e.getMessage());
        }
    }

    @GetMapping("/wards")
    public ResponseEntity<Map> getWards(@RequestParam Integer districtId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Token", ghnToken);
            headers.set("Content-Type", "application/json");

            String url = ghnBaseUrl + "/master-data/ward?district_id=" + districtId;
            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lấy danh sách xã/phường: " + e.getMessage());
        }
    }
}