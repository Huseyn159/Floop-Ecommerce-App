package com.floop.payment.dto;

import com.floop.payment.entity.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID orderId;
    private UUID customerId;
    private PaymentStatus status;
    private Double amount;
    private String currency;
    private String failureReason;
    private LocalDateTime createdAt;
}