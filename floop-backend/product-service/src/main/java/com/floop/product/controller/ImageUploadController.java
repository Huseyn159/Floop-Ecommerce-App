package com.floop.product.controller;

import com.floop.product.dto.ProductImageResponse;
import com.floop.product.service.CloudinaryService;
import com.floop.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;
    private final ProductService productService;

    @PostMapping("/{productId}/images/upload")
    public ResponseEntity<ProductImageResponse> uploadImage(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary
    ) {
        Map<String, String> uploaded = cloudinaryService.uploadProductImage(file, productId);
        ProductImageResponse response = productService.addProductImage(
                userId, productId, uploaded.get("url"), uploaded.get("publicId"), isPrimary
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/images/upload-only")
    public ResponseEntity<Map<String, String>> uploadOnly(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("productId") UUID productId
    ) {
        Map<String, String> result = cloudinaryService.uploadProductImage(file, productId);
        return ResponseEntity.ok(result);
    }
}