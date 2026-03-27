package com.floop.auth.service.impl;

import com.floop.auth.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendVerificationEmail(String to, String firstName, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        String html = loadTemplate("email/verification-email.html")
                .replace("{{firstName}}", firstName)
                .replace("{{link}}", link);
        sendHtmlEmail(to, "Verify your Floop account", html);
    }

    @Override
    public void sendPasswordResetEmail(String to, String firstName, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        String html = loadTemplate("email/password-reset-email.html")
                .replace("{{firstName}}", firstName)
                .replace("{{link}}", link);
        sendHtmlEmail(to, "Reset your Floop password", html);
    }

    private String loadTemplate(String path) {
        try {
            ClassPathResource resource = new ClassPathResource("templates/" + path);
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Email template not found: " + path, e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}