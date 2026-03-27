package com.floop.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

// payment-service bu event-i Kafka-ya göndərir
// order-service dinləyir → sifarişi CONFIRMED/CANCELLED edir
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentResultEvent {
    private UUID orderId;
    private String paymentId;
    private String status;
    private String message;
}