package com.floop.product.dto;

import com.floop.product.entity.ProductStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private UUID vendorId;
    private String name;
    private String description;
    private Double basePrice;
    private Double discountedPrice;
    private Double effectivePrice;
    private Boolean isOnSale;
    private LocalDateTime saleEndTime;
    private Double rating;
    private Integer reviewCount;
    private Integer viewCount;
    private Integer salesCount;
    private  Integer discountPercentage;
    private ProductStatus status;
    private CategoryResponse category;
    private List<ProductVariantResponse> variants;
    private List<ProductImageResponse> images;
    private LocalDateTime createdAt;
}