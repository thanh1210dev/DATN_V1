package com.example.datnmainpolo.controller;


import com.example.datnmainpolo.dto.ImageDTO.ImageDTO;
import com.example.datnmainpolo.service.Impl.ImageService.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    @Autowired
    private ImageService imageService;

    @Value("${upload.dir}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<List<ImageDTO>> uploadImages(@RequestParam("files") MultipartFile[] files) throws Exception {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        List<ImageDTO> uploadedImages = new ArrayList<>();
        for (MultipartFile file : files) {
            uploadedImages.add(imageService.addImage(file, username));
        }
        return ResponseEntity.ok(uploadedImages);
    }

    @GetMapping
    public ResponseEntity<List<ImageDTO>> getAllImages() {
        return ResponseEntity.ok(imageService.getAllImages());
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Integer imageId) throws Exception {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        imageService.deleteImage(imageId, username);
        return ResponseEntity.ok().build();
    }



    private String getFileExtension(String fileName) {
        if (fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        }
        return "jpg"; // Mặc định
    }
}