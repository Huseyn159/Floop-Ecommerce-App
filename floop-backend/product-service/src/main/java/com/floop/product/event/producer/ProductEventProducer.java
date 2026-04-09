package com.floop.product.event.producer;

import com.floop.product.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String PRODUCT_CREATED_TOPIC = "product-created";
    private static final String PRODUCT_UPDATED_TOPIC = "product-updated";
    private static final String PRODUCT_DELETED_TOPIC = "product-deleted";

    public void sendProductCreated(ProductCreatedEvent event) {
        kafkaTemplate.send(PRODUCT_CREATED_TOPIC,
                event.getProductId().toString(), event);
        log.info("ProductCreatedEvent sent: productId={}", event.getProductId());
    }

    public void sendProductUpdated(ProductUpdatedEvent event) {
        kafkaTemplate.send(PRODUCT_UPDATED_TOPIC,
                event.getProductId().toString(), event);
        log.info("ProductUpdatedEvent sent: productId={}", event.getProductId());
    }

    public void sendProductDeleted(ProductDeletedEvent event) {
        kafkaTemplate.send(PRODUCT_DELETED_TOPIC,
                event.getProductId().toString(), event);
        log.info("ProductDeletedEvent sent: productId={}", event.getProductId());
    }
}