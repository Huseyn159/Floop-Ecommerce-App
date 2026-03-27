package com.floop.payment.event.producer;


import com.floop.payment.event.PaymentResultEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventProducer {

    private  final KafkaTemplate<String, PaymentResultEvent> kafkaTemplate;
    private static final String PAYMENT_RESULT_TOPIC = "payment-result";

    public void sendPaymentResult(PaymentResultEvent event){
        kafkaTemplate.send(PAYMENT_RESULT_TOPIC,
                event.getOrderId().toString(),
                event);
        log.info("PaymentResultEvent sent: orderId={}, status={}",
                event.getOrderId(), event.getStatus());
    }

}
