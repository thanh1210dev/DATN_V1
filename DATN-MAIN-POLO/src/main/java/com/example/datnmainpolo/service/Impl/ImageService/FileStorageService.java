package com.example.datnmainpolo.service.Impl.ImageService;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class FileStorageService {
    @Value("${upload.dir}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) throws Exception {
        if (file.isEmpty()) {
            throw new Exception("File is empty");
        }

        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String timestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = timestamp + "." + fileExtension; // Ví dụ: 20250614105823.jpg

        Path filePath = Paths.get(uploadDir, fileName);
        Files.copy(file.getInputStream(), filePath);

        return "/images/" + fileName;
    }

    private String getFileExtension(String fileName) throws Exception {
        if (fileName == null || !fileName.contains(".")) {
            return "jpg";
        }
        String ext = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        if (!ext.matches("jpg|jpeg|png")) {
            throw new Exception("Only JPG, JPEG, PNG files are allowed");
        }
        return ext;
    }
}