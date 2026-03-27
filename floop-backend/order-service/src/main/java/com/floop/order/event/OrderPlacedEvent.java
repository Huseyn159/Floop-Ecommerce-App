package com.floop.order.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderPlacedEvent {
    private UUID orderId;
    private UUID customerId;
    private UUID vendorId;
    private Double totalAmount;
    private String currency;
}