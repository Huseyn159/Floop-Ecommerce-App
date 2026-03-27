package com.floop.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CategoryResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private CategoryResponse parent;
    private List<CategoryResponse> children;
    private boolean active;
}