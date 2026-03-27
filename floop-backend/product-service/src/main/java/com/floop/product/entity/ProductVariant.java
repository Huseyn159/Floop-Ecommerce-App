package com.floop.product.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private String size;
    private String color;
    private String material;

    // Bu variant üçün fərqli qiymət (null = base price)
    private Double priceModifier;

    private Integer stockQuantity;
    private String sku; // unikal məhsul kodu
}