package com.floop.auth.service.impl;

import com.floop.auth.dto.AuthResponse;
import com.floop.auth.dto.OAuth2Request;
import com.floop.auth.entity.Role;
import com.floop.auth.entity.User;
import com.floop.auth.event.UserEventProducer;
import com.floop.auth.event.UserRegisteredEvent;
import com.floop.auth.exception.BadRequestException;
import com.floop.auth.repository.UserRepository;
import com.floop.auth.security.JwtUtil;
import com.floop.auth.service.OAuth2Service;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class OAuth2ServiceImpl implements OAuth2Service {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${google.client-id}")
    private String googleClientId;

    private final UserEventProducer userEventProducer;


    @Override
    @Transactional
    public AuthResponse loginWithGoogle(OAuth2Request request) {

        GoogleIdToken.Payload payload = verifyGoogleToken(request.getIdToken());

        String email = payload.getEmail();
        String firstName = (String) payload.get("given_name");
        String lastName = (String) payload.get("family_name");
        String providerId = payload.getSubject();


        User user = userRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(
                        email, firstName, lastName, providerId));

        return buildAuthResponse(user);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier
                    .Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);

            if (googleIdToken == null) {
                throw new BadRequestException("Invalid Google token");
            }

            return googleIdToken.getPayload();
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Failed to verify Google token");
        }
    }

    private User createGoogleUser(String email, String firstName,
                                  String lastName, String providerId) {
        User user = User.builder()
                .email(email)
                .password("") // OAuth2 user-inin şifrəsi olmur
                .firstName(firstName != null ? firstName : "")
                .lastName(lastName != null ? lastName : "")
                .role(Role.CUSTOMER)
                .emailVerified(true) // Google email-i artıq təsdiqlənib
                .blocked(false)
                .provider("google")
                .providerId(providerId)
                .failedLoginAttempts(0)
                .build();

        User savedUser = userRepository.save(user);

        userEventProducer.sendUserRegisteredEvent(
                UserRegisteredEvent.builder()
                        .userId(savedUser.getId())
                        .email(savedUser.getEmail())
                        .firstName(savedUser.getFirstName())
                        .lastName(savedUser.getLastName())
                        .provider("google")
                        .build()
        );

        return savedUser;
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId().toString());

        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }
}