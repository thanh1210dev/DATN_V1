package com.example.datnmainpolo.service.Impl.ImageService;

import com.example.datnmainpolo.dto.ImageDTO.ImageDTO;
import com.example.datnmainpolo.dto.ImageDTO.ImageSelectionDTO;
import com.example.datnmainpolo.entity.Image;
import com.example.datnmainpolo.entity.ProductDetail;
import com.example.datnmainpolo.repository.ImageRepository;
import com.example.datnmainpolo.repository.ProductDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ImageService {
    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private ProductDetailRepository productDetailRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Value("${upload.dir}")
    private String uploadDir;

    public ImageDTO addImage(MultipartFile file, String username) throws Exception {
        String imageUrl = fileStorageService.uploadFile(file);

        Image image = new Image();
        image.setUrl(imageUrl);
        image.setStatus("ACTIVE");
        image.setCover(false);
        image.setCreatedAt(Instant.now());
        image.setCreatedBy(username);
        image.setDeleted(false);

        image = imageRepository.save(image);
        return mapToDTO(image);
    }

    public List<ImageDTO> getAllImages() {
        return imageRepository.findAllActiveImages().stream()

                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ImageDTO> selectImagesForProductDetail(Integer productDetailId, ImageSelectionDTO selectionDTO) throws Exception {
        ProductDetail productDetail = productDetailRepository.findById(productDetailId)
                .orElseThrow(() -> new Exception("Product detail not found"));

        List<Integer> imageIds = selectionDTO.getImageIds();
        if (imageIds.size() > 3) {
            throw new Exception("Cannot select more than 3 images");
        }

        List<Image> selectedImages = imageRepository.findAllById(imageIds);
        if (selectedImages.size() != imageIds.size()) {
            throw new Exception("One or more image IDs are invalid");
        }

        productDetail.getImages().clear();
        productDetail.getImages().addAll(selectedImages);
        productDetail.setUpdatedAt(Instant.now());

        productDetailRepository.save(productDetail);

        return selectedImages.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ImageDTO> getImagesByProductDetailId(Integer productDetailId) {
        ProductDetail productDetail = productDetailRepository.findById(productDetailId)
                .orElseThrow(() -> new IllegalArgumentException("Product detail not found"));
        return productDetail.getImages().stream()
                .filter(image -> !image.getDeleted()) // Chỉ lấy ảnh có deleted = false
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public void deleteImageFromProductDetail(Integer productDetailId, Integer imageId, String username) throws Exception {
        ProductDetail productDetail = productDetailRepository.findById(productDetailId)
                .orElseThrow(() -> new Exception("Product detail not found"));
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new Exception("Image not found"));

        if (!productDetail.getImages().contains(image)) {
            throw new Exception("Image does not belong to this product detail");
        }

        productDetail.getImages().remove(image);
        productDetail.setUpdatedAt(Instant.now());
        productDetailRepository.save(productDetail);
    }

    public void deleteImage(Integer imageId, String username) throws Exception {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new Exception("Image not found"));

        // Xóa file khỏi hệ thống
        String fileName = image.getUrl().replace("/images/", "");
        Path filePath = Paths.get(uploadDir, fileName);
        File file = new File(filePath.toString());
        if (file.exists()) {
            file.delete();
        }


        imageRepository.delete(image);
    }

    private ImageDTO mapToDTO(Image image) {
        ImageDTO dto = new ImageDTO();
        dto.setId(image.getId());
        dto.setUrl(image.getUrl());
        dto.setStatus(image.getStatus());
        dto.setCover(image.getCover());
        return dto;
    }
}