package com.floop.order.event;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreatedEvent {
    private UUID productId;
    private UUID vendorId;
    private String name;
    private Double basePrice;
    private Double discountedPrice;
    private LocalDateTime saleEndTime;
    private String status;
}