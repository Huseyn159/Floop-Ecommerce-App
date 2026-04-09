package com.floop.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_snapshots")
@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSnapshot {

    @Id
    private UUID productId;

    private UUID vendorId;
    private String name;
    private Double basePrice;
    private Double discountedPrice;
    private LocalDateTime saleEndTime;
    private String status;

    public Double getEffectivePrice() {
        boolean onSale = discountedPrice != null &&
                saleEndTime != null &&
                saleEndTime.isAfter(LocalDateTime.now());
        return onSale ? discountedPrice : basePrice;
    }
}