package com.floop.auth.event;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventProducer {

    private final KafkaTemplate<String, UserRegisteredEvent> kafkaTemplate;

    //Topic adi
    private static final String USER_REGISTERED_TOPIC = "user-registered";


    public void sendUserRegisteredEvent(UserRegisteredEvent event){

        CompletableFuture<SendResult<String, UserRegisteredEvent>> future =
                kafkaTemplate.send(USER_REGISTERED_TOPIC,
                        event.getUserId().toString(),
                        event);

        future.whenComplete((result,ex) -> {
            if (ex == null){
                log.info("UserRegisteredEvent sent successfully: userId={}, partition={}, offset={}",
                        event.getUserId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
            else {
                log.error("Failed to send UserRegisteredEvent: userId={}, error={}",
                        event.getUserId(), ex.getMessage());
            }
        });
    }
}
