package com.floop.user.exception;

import java.util.UUID;

public class UserProfileNotFoundException extends RuntimeException {
    public UserProfileNotFoundException(UUID userId) {
        super("User profile not found with id: " + userId);
    }
}