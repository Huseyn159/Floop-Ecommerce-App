package com.floop.order.dto;

import com.floop.order.entity.OrderStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderResponse {
    private UUID id;
    private UUID customerId;
    private UUID vendorId;
    private OrderStatus status;
    private String paymentId;
    private Double totalAmount;
    private String currency;
    private String shippingAddress;
    private String shippingCity;
    private String shippingCountry;
    private String trackingNumber;
    private String cancellationReason;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
}