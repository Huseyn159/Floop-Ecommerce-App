package com.floop.auth.event.consumer;

import com.floop.auth.entity.Role;
import com.floop.auth.event.VendorApprovedEvent;
import com.floop.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class VendorEventConsumer {

    private final UserRepository userRepository;

    @KafkaListener(
            topics = "vendor-approved",
            groupId = "auth-service-group"
    )
    @Transactional
    public void handleVendorApproved(VendorApprovedEvent event) {
        log.info("Received VendorApprovedEvent: userId={}", event.getUserId());

        userRepository.findById(event.getUserId()).ifPresent(user -> {
            user.setRole(Role.VENDOR);
            userRepository.save(user);
            log.info("User role updated to VENDOR: userId={}", event.getUserId());
        });
    }
}