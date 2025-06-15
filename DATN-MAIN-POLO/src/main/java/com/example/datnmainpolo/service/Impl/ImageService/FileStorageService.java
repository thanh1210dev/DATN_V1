package com.example.datnmainpolo.service.Impl.ImageService;



import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${upload.dir}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) throws IOException, NoSuchAlgorithmException {
        // Ensure the upload directory exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Compute MD5 hash of the file content for duplicate check
        String fileHash = calculateMD5(file.getInputStream());
        Path hashFile = uploadPath.resolve("hashes.txt");
        if (Files.exists(hashFile)) {
            String existingHashes = new String(Files.readAllBytes(hashFile));
            if (existingHashes.contains(fileHash)) {
                throw new IOException("Hình ảnh đã tồn tại: Không thể đăng trùng ảnh!");
            }
        }

        // Generate a unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String uniqueFilename = Instant.now().toEpochMilli() + "_" + UUID.randomUUID().toString() + fileExtension;
        Path destinationPath = uploadPath.resolve(uniqueFilename).normalize().toAbsolutePath();

        // Copy the file to the destination
        Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

        // Update hash file with new hash
        Files.writeString(hashFile, fileHash + "\n", StandardOpenOption.APPEND, StandardOpenOption.CREATE);

        return "/images/" + uniqueFilename;
    }

    private String calculateMD5(InputStream inputStream) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("MD5");
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            digest.update(buffer, 0, bytesRead);
        }
        byte[] md5Bytes = digest.digest();
        StringBuilder md5Hex = new StringBuilder();
        for (byte b : md5Bytes) {
            md5Hex.append(String.format("%02x", b));
        }
        return md5Hex.toString();
    }
}