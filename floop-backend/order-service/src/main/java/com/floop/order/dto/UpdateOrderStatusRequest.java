package com.floop.order.dto;

import com.floop.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotNull
    private OrderStatus status;

    private String trackingNumber;
    private String cancellationReason;
}