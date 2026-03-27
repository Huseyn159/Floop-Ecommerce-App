package com.floop.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ProductImageResponse {
    private UUID id;
    private String url;
    private boolean isPrimary;
    private Integer sortOrder;
}