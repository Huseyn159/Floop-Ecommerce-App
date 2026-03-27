package com.floop.user.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String avatarUrl;
    private String bio;
    private boolean emailNotifications;
    private boolean pushNotifications;
    private String language;
    private String currency;
    private LocalDateTime createdAt;
}