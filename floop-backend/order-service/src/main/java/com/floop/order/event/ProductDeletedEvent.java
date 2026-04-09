package com.floop.order.event;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDeletedEvent {
    private UUID productId;
}