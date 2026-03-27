package com.floop.order.event.producer;

import com.floop.order.event.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventProducer {

    private final KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;
    private static final String ORDER_PLACED_TOPIC = "order-placed";

    public void sendOrderPlacedEvent(OrderPlacedEvent event) {
        kafkaTemplate.send(ORDER_PLACED_TOPIC,
                event.getOrderId().toString(),
                event);
        log.info("OrderPlacedEvent sent: orderId={}", event.getOrderId());
    }
}