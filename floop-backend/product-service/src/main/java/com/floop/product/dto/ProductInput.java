package com.floop.product.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ProductInput {

    @NotBlank
    @Size(min = 2, max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    @DecimalMin(value = "0.01")
    private Double basePrice;

    @NotNull
    private UUID categoryId;

    private List<ProductVariantInput> variants;
}