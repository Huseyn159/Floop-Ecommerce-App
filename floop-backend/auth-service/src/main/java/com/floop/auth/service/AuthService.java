package com.floop.auth.service;

import com.floop.auth.dto.AuthResponse;
import com.floop.auth.dto.LoginRequest;
import com.floop.auth.dto.RegisterRequest;

public interface AuthService {
    void register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void verifyEmail(String token);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword, String confirmPassword);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
}
