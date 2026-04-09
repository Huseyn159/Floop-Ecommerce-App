package com.floop.product.event;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdatedEvent {
    private UUID productId;
    private UUID vendorId;
    private String name;
    private Double basePrice;
    private Double discountedPrice;
    private LocalDateTime saleEndTime;
    private String status;
}