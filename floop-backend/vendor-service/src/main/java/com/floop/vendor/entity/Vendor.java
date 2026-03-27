package com.floop.vendor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor {

    @Id
    private UUID userId;

    @Column(nullable = false)
    private String storeName;

    @Column(unique = true, nullable = false)
    private String storeSlug; // floop.com/store/nike

    private String storeDescription;
    private String storeLogoUrl;
    private String storeBannerUrl;


    private String businessEmail;
    private String businessPhone;
    private String businessAddress;


    @Enumerated(EnumType.STRING)
    private VendorStatus status;

    private Double rating;
    private Integer totalSales;
    private Integer totalProducts;

    // Komisyon — platform neçə faiz alır
    private Double commissionRate;

    // Balans — satışlardan qazanc
    private Double balance;

    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String rejectionReason;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = VendorStatus.PENDING;
        rating = 0.0;
        totalSales = 0;
        totalProducts = 0;
        commissionRate = 10.0;
        balance = 0.0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}