package com.floop.payment.dto;

import com.floop.payment.entity.TransactionType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {
    private UUID id;
    private UUID paymentId;
    private TransactionType type;
    private Double amount;
    private String description;
    private LocalDateTime createdAt;
}