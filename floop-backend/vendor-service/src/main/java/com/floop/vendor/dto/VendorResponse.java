package com.floop.vendor.dto;

import com.floop.vendor.entity.VendorStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class VendorResponse {
    private UUID userId;
    private String storeName;
    private String storeSlug;
    private String storeDescription;
    private String storeLogoUrl;
    private String storeBannerUrl;
    private String businessEmail;
    private String businessPhone;
    private VendorStatus status;
    private Double rating;
    private Integer totalSales;
    private Integer totalProducts;
    private Double balance;
    private LocalDateTime createdAt;
}