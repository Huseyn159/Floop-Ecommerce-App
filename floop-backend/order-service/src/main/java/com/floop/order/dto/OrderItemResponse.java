package com.floop.order.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class OrderItemResponse {
    private UUID id;
    private UUID productId;
    private UUID variantId;
    private String productName;
    private String variantInfo;
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
}