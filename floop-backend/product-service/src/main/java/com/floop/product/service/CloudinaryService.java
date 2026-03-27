package com.floop.product.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public  Map<String, String>  uploadProductImage(MultipartFile file, UUID productId) {
        try {
            validateFile(file);
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder",        "floop/products/" + productId,
                            "public_id",     UUID.randomUUID().toString(),
                            "transformation","w_800,h_800,c_limit,q_auto,f_auto",
                            "resource_type", "image"
                    )
            );
            return Map.of(
                    "url",      (String) result.get("secure_url"),
                    "publicId", (String) result.get("public_id")
            );
        } catch (IOException e) {
            throw new RuntimeException("Şəkil yüklənərkən xəta: " + e.getMessage());
        }
    }

    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deleted from Cloudinary: publicId={}", publicId);
        } catch (IOException e) {
            log.warn("Cloudinary delete failed: {}", e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Fayl boşdur");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Yalnız şəkil faylı yükləyə bilərsiniz (JPEG, PNG, WebP)");
        }

        // 5MB limit
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Fayl ölçüsü 5MB-dan çox ola bilməz");
        }
    }
}