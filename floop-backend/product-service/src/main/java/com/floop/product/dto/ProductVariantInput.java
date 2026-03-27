package com.floop.product.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ProductVariantInput {
    private String size;
    private String color;
    private String material;
    private Double priceModifier;

    @NotNull
    @Min(0)
    private Integer stockQuantity;

    @NotBlank
    private String sku;
}