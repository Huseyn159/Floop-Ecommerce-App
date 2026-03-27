package com.floop.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    private UUID productId;
    private UUID variantId;
    private String productName;
    private String variantInfo; // "Red, XL"
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
}