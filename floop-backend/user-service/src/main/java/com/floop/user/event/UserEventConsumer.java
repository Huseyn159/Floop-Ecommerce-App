package com.floop.user.event;


import com.floop.user.entity.UserProfile;
import com.floop.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventConsumer {

    private final UserProfileRepository userProfileRepository;



    @KafkaListener(
            topics = "user-registered",
            groupId = "user-service-group"
    )
    public void handleUserRegistered(UserRegisteredEvent event){
        log.info("Received UserRegisteredEvent: userId={}, email={}",
                event.getUserId(), event.getEmail());

        if (userProfileRepository.existsById(event.getUserId())) {
            log.warn("UserProfile already exists for userId={}, skipping",
                    event.getUserId());
            return;
        }

        UserProfile profile = UserProfile.builder()
                .userId(event.getUserId())
                .email(event.getEmail())
                .firstName(event.getFirstName())
                .lastName(event.getLastName())
                .build();

        userProfileRepository.save(profile);

        log.info("UserProfile created successfully for userId={}",
                event.getUserId());


    }





}

