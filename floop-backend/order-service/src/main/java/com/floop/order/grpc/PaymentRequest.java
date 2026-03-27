package com.floop.order.grpc;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentRequest {
    private String orderId;
    private String customerId;
    private double amount;
    private String currency;
}