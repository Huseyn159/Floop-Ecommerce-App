package com.floop.order.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID customerId;

    @Column(nullable = false)
    private UUID vendorId;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    // Ödəniş məlumatları
    private String paymentId;
    private Double totalAmount;
    private String currency;

    // Çatdırılma ünvanı
    private String shippingAddress;
    private String shippingCity;
    private String shippingCountry;
    private String shippingZipCode;

    // İzləmə
    private String trackingNumber;

    private String cancellationReason;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = OrderStatus.PENDING;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}