package com.floop.product.dto;

import lombok.Data;
import lombok.ToString;

import java.util.UUID;

@Data
@ToString
public class ProductFilter {
    private UUID categoryId;
    private UUID vendorId;
    private Double minPrice;
    private Double maxPrice;
    private Double minRating;
    private Boolean inStockOnly;
    private Boolean onSaleOnly;
    private String searchQuery;
}