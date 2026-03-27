package com.floop.auth.service;


public interface EmailService {
    void sendVerificationEmail(String to, String firstName, String token);
    void sendPasswordResetEmail(String to, String firstName, String token);
}