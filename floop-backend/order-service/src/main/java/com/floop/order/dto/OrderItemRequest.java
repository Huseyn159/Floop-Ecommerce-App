package com.floop.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class OrderItemRequest {

    @NotNull
    private UUID productId;

    private UUID variantId;

    @NotNull
    @Min(1)
    private Integer quantity;
}