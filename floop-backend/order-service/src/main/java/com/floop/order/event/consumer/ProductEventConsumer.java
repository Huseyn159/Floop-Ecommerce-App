package com.floop.order.event.consumer;

import com.floop.order.entity.ProductSnapshot;
import com.floop.order.event.*;
import com.floop.order.repository.ProductSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductEventConsumer {

    private final ProductSnapshotRepository productSnapshotRepository;

    @KafkaListener(
            topics = "product-created",
            groupId = "order-service-group",
            containerFactory = "productCreatedKafkaListenerContainerFactory"
    )
    @Transactional
    public void handleProductCreated(ProductCreatedEvent event) {
        ProductSnapshot snapshot = ProductSnapshot.builder()
                .productId(event.getProductId())
                .vendorId(event.getVendorId())
                .name(event.getName())
                .basePrice(event.getBasePrice())
                .discountedPrice(event.getDiscountedPrice())
                .saleEndTime(event.getSaleEndTime())
                .status(event.getStatus())
                .build();

        productSnapshotRepository.save(snapshot);
        log.info("ProductSnapshot saved: productId={}", event.getProductId());
    }

    @KafkaListener(
            topics = "product-updated",
            groupId = "order-service-group",
            containerFactory = "productUpdatedKafkaListenerContainerFactory"
    )
    @Transactional
    public void handleProductUpdated(ProductUpdatedEvent event) {
        productSnapshotRepository.findById(event.getProductId())
                .ifPresent(snapshot -> {
                    snapshot.setVendorId(event.getVendorId());
                    snapshot.setName(event.getName());
                    snapshot.setBasePrice(event.getBasePrice());
                    snapshot.setDiscountedPrice(event.getDiscountedPrice());
                    snapshot.setSaleEndTime(event.getSaleEndTime());
                    snapshot.setStatus(event.getStatus());
                    productSnapshotRepository.save(snapshot);
                    log.info("ProductSnapshot updated: productId={}", event.getProductId());
                });
    }

    @KafkaListener(
            topics = "product-deleted",
            groupId = "order-service-group",
            containerFactory = "productDeletedKafkaListenerContainerFactory"
    )
    @Transactional
    public void handleProductDeleted(ProductDeletedEvent event) {
        productSnapshotRepository.deleteById(event.getProductId());
        log.info("ProductSnapshot deleted: productId={}", event.getProductId());
    }
}