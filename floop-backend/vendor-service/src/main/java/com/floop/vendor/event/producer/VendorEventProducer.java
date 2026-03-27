package com.floop.vendor.event.producer;
import com.floop.vendor.event.VendorApprovedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class VendorEventProducer {

    private final KafkaTemplate<String, VendorApprovedEvent> kafkaTemplate;
    private static final String VENDOR_APPROVED_TOPIC = "vendor-approved";

    public void sendVendorApprovedEvent(VendorApprovedEvent event) {
        kafkaTemplate.send(VENDOR_APPROVED_TOPIC,
                event.getUserId().toString(),
                event);
        log.info("VendorApprovedEvent sent: userId={}", event.getUserId());
    }
}