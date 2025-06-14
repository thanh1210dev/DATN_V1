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

        // Generate a unique filename using timestamp and UUID
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String uniqueFilename = Instant.now().toEpochMilli() + "_" + UUID.randomUUID().toString() + fileExtension;
        Path destinationPath = uploadPath.resolve(uniqueFilename).normalize().toAbsolutePath();

        // Check if a file with the same content already exists (basic hash check or filename check)
        // For simplicity, we'll check if the filename (without UUID) exists
        String baseFilename = originalFilename != null ? originalFilename : "unknown" + fileExtension;
        Path existingPath = uploadPath.resolve(baseFilename);
        if (Files.exists(existingPath)) {
            throw new IOException("Dgit checkout main\n " + baseFilename);
        }

        // Copy the file to the destination
        Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

        // Return the relative path
        return "/images/" + uniqueFilename;
    }
}