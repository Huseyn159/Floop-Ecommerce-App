package com.floop.product.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID vendorId;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private Double basePrice;

    // Flash sale
    private Double discountedPrice;
    private LocalDateTime saleEndTime;

    // Statistika
    private Double rating;
    private Integer reviewCount;
    private Integer viewCount;    // trending üçün
    private Integer salesCount;   // popular üçün

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductVariant> variants;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductImage> images;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = ProductStatus.ACTIVE;
        rating = 0.0;
        reviewCount = 0;
        viewCount = 0;
        salesCount = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Flash sale aktiv mi?
    public boolean isOnSale() {
        return discountedPrice != null &&
                saleEndTime != null &&
                saleEndTime.isAfter(LocalDateTime.now());
    }

    // Aktiv qiymət
    public Double getEffectivePrice() {
        return isOnSale() ? discountedPrice : basePrice;
    }

    public Integer getDiscountPercentage() {
        if (!isOnSale()) return null;
        return (int) Math.round((1 - discountedPrice / basePrice) * 100);
    }
}