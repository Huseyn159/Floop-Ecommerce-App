package com.floop.product.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private String url;        // Cloudinary URL
    private String publicId;   // Cloudinary public ID (silmək üçün)
    private boolean isPrimary; // Əsas şəkil
    private Integer sortOrder;
}