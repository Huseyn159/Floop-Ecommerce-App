package com.floop.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ProductVariantResponse {
    private UUID id;
    private String size;
    private String color;
    private String material;
    private Double priceModifier;
    private Integer stockQuantity;
    private String sku;
}