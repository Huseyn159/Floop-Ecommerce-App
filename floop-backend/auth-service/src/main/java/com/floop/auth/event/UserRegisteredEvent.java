package com.floop.auth.event;


import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserRegisteredEvent {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String provider;
}
