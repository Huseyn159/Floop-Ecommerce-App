package com.floop.order.event.consumer;

import com.floop.order.entity.Order;
import com.floop.order.entity.OrderStatus;
import com.floop.order.event.PaymentResultEvent;
import com.floop.order.repository.OrderRepository;
import com.floop.order.websocket.OrderWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventConsumer {

    private final OrderRepository orderRepository;
    private final OrderWebSocketHandler webSocketHandler;

    @KafkaListener(
            topics = "payment-result",
            groupId = "order-service-group",
            containerFactory = "paymentKafkaListenerContainerFactory"
    )
    @Transactional
    public void handlePaymentResult(PaymentResultEvent event) {
        log.info("Received PaymentResultEvent: orderId={}, status={}",
                event.getOrderId(), event.getStatus());

        orderRepository.findById(event.getOrderId()).ifPresent(order -> {
            if ("SUCCESS".equals(event.getStatus())) {
                order.setStatus(OrderStatus.CONFIRMED);
                order.setPaymentId(event.getPaymentId());
                log.info("Order confirmed: orderId={}", order.getId());
            } else {
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancellationReason("Payment failed: " + event.getMessage());
                log.info("Order cancelled due to payment failure: orderId={}", order.getId());
            }

            orderRepository.save(order);

            webSocketHandler.sendOrderUpdate(order.getId(), order.getStatus());
        });
    }
}