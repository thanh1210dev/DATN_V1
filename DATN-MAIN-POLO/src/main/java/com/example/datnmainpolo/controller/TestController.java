package com.example.datnmainpolo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        System.out.println("=== TEST CONTROLLER DEBUG ===");
        System.out.println("GET /api/test/hello called");
        return ResponseEntity.ok("Hello from API!");
    }
    
    @PostMapping("/simple")
    public ResponseEntity<String> simplePost(@RequestBody String data) {
        System.out.println("=== TEST CONTROLLER POST DEBUG ===");
        System.out.println("POST /api/test/simple called with data: " + data);
        return ResponseEntity.ok("Posted: " + data);
    }
    
    @PostMapping("/multipart")
    public ResponseEntity<String> multipartTest(
        @RequestPart("data") String data,
        @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        System.out.println("=== TEST MULTIPART DEBUG ===");
        System.out.println("POST /api/test/multipart called");
        System.out.println("Data: " + data);
        if (file != null) {
            System.out.println("File: " + file.getOriginalFilename() + ", size: " + file.getSize());
        }
        return ResponseEntity.ok("Multipart received: " + data);
    }
    
    @PostMapping("/category-test")
    public ResponseEntity<String> categoryTest(
        @RequestPart("category") String categoryJson,
        @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        System.out.println("=== CATEGORY TEST ENDPOINT (NO AUTH) ===");
        System.out.println("POST /api/test/category-test called");
        System.out.println("Category JSON: " + categoryJson);
        
        if (image != null) {
            System.out.println("Image received: " + image.getOriginalFilename() + " (" + image.getSize() + " bytes)");
            return ResponseEntity.ok("Category test successful! Category: " + categoryJson + ", Image: " + image.getOriginalFilename());
        } else {
            System.out.println("No image received");
            return ResponseEntity.ok("Category test successful! Category: " + categoryJson + ", No image");
        }
    }
}
