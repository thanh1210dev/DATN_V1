package com.example.datnmainpolo.service.Impl.ImageService;



import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${upload.dir}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) throws IOException {
        // Ensure the upload directory exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        // Always generate a unique filename (allow duplicate content uploads)
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String uniqueFilename = Instant.now().toEpochMilli() + "_" + UUID.randomUUID().toString() + fileExtension;
        Path destinationPath = uploadPath.resolve(uniqueFilename).normalize().toAbsolutePath();

        // Copy the file to the destination
        Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

        return "/images/" + uniqueFilename;
    }
}